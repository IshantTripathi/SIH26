import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { FileText, Star, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InvoiceModal } from '../../components/common/InvoiceModal';

export function BookingHistoryPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getJobs();
      if (res.success) {
        setJobs(res.jobs);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const filteredJobs = filter === 'ALL' ? jobs : jobs.filter(j => j.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/customer" className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Booking Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">My Service Bookings & Invoices</h1>
          <p className="text-xs text-slate-500">
            Complete transaction record, job logs, and official cooperative receipts.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 text-xs font-bold">
        {['ALL', 'COMPLETED', 'PAID', 'IN_PROGRESS', 'ACCEPTED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === st ? 'bg-[#0f2e5a] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading booking records...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No bookings match the selected filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Job ID</th>
                  <th className="p-3">Service & Trade</th>
                  <th className="p-3">Assigned Worker</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Gross Amount</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono text-blue-900 font-bold">
                      #{job.code || job.id.slice(-6)}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{job.serviceCategory}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{job.problemDescription}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-800">{job.workerName || 'Matching in progress'}</div>
                      <div className="text-[10px] text-slate-400">Society: {job.societyId}</div>
                    </td>
                    <td className="p-3 text-slate-600">
                      {job.scheduledDate || new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          job.status === 'COMPLETED' || job.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {job.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      ₹{job.pricing?.grossAmount || 500}
                    </td>
                    <td className="p-3 text-right">
                      {job.paymentStatus === 'PAID' ? (
                        <button
                          onClick={() => setSelectedInvoice(job)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded text-[11px] inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-700" />
                          Invoice
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">In Progress</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InvoiceModal
        job={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}
