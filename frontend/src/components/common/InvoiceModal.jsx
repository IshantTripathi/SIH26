import React from 'react';
import { Building2, Printer, X, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function InvoiceModal({ job, isOpen, onClose }) {
  if (!isOpen || !job) return null;

  const pricing = job.pricing || {
    grossAmount: 500,
    coopContribution: 20,
    welfareDeduction: 5,
    netWorkerEarnings: 475,
    coopPercent: 4.0,
    welfarePercent: 1.0
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Action Header - Hide in print */}
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex items-center justify-between no-print">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Cooperative Service Receipt (Demo Environment)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-8 space-y-6 text-slate-800 text-sm">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded bg-[#0f2e5a] flex items-center justify-center text-amber-400 font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 leading-tight">
                    Central Metro Labour Cooperative Society (Demo)
                  </h1>
                  <p className="text-[11px] text-slate-500">
                    Reg. No: SOC-REG-DEMO-01 • Demo Cooperative Marketplace
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-400 uppercase">Receipt #</div>
              <div className="text-sm font-bold text-slate-900 font-mono">
                {job.invoiceNumber || `INV-2026-${job.id?.slice(-4) || '8491'}`}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Date: {job.completedAt ? new Date(job.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-400 font-semibold uppercase block text-[10px]">
                {job.customerType === 'Institution' ? 'Institution Requester Details' : 'Customer Details'}
              </span>
              <span className="font-bold text-slate-800 block text-sm">{job.customerName}</span>
              {job.customerType === 'Institution' && (
                <span className="text-blue-900 font-semibold block text-[11px]">
                  {job.institutionName} ({job.institutionType})
                </span>
              )}
              <span className="text-slate-600 block">{job.customerAddress}</span>
              <span className="text-slate-500 block">Phone: {job.customerPhone}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase block text-[10px]">Assigned Cooperative Worker</span>
              <span className="font-bold text-slate-800 block text-sm">{job.workerName}</span>
              <span className="text-slate-600 block">Worker Code: {job.workerId || 'WORKER-DEMO-001'}</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3" /> Verified Cooperative Badge (Demo)
              </span>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2">Service Description</th>
                <th className="py-2">Category</th>
                <th className="py-2">Urgency</th>
                <th className="py-2 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr>
                <td className="py-3">
                  <div className="font-bold text-slate-900">{job.serviceTitle}</div>
                  <div className="text-[11px] text-slate-500">{job.problemDescription}</div>
                </td>
                <td className="py-3 text-slate-600">{job.serviceCategory}</td>
                <td className="py-3">
                  <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px]">
                    {job.urgency || 'Normal'}
                  </span>
                </td>
                <td className="py-3 text-right font-bold text-slate-900 font-mono text-sm">
                  ₹{pricing.grossAmount}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Transparent Cooperative Breakdown */}
          <div className="border-t border-slate-200 pt-4 flex justify-end">
            <div className="w-80 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Gross Service Charge:</span>
                <span className="font-mono font-semibold">₹{pricing.grossAmount}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>• Society Administration ({pricing.coopPercent || 4}%):</span>
                <span className="font-mono">₹{pricing.coopContribution}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>• Demo Welfare & Accidental Fund ({pricing.welfarePercent || 1}%):</span>
                <span className="font-mono">₹{pricing.welfareDeduction}</span>
              </div>
              <div className="flex justify-between text-emerald-800 text-[11px] font-semibold bg-emerald-50 p-1 rounded">
                <span>• Net Direct Worker Wage:</span>
                <span className="font-mono">₹{pricing.netWorkerEarnings}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold border-t border-slate-300 pt-2 text-sm">
                <span>Total Paid (Demo Payment):</span>
                <span className="font-mono text-blue-900">₹{pricing.grossAmount}</span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-400 space-y-1">
            <p>
              * Demo contribution model — values are configurable and are not presented as statutory rates.
            </p>
            <p>
              * Worker welfare allocation is directed to Demo Policy #INS-DEMO-001 for occupational safety support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default InvoiceModal;
