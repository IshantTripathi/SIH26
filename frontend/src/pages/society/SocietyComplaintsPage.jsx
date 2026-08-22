import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, MessageSquare, ShieldAlert } from 'lucide-react';

export function SocietyComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [targetStatus, setTargetStatus] = useState('Resolution');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.getComplaints();
      if (res.success) {
        setComplaints(res.complaints || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      const res = await api.updateComplaintStatus(selectedComplaint.id, {
        status: targetStatus,
        resolutionNotes
      });
      if (res.success) {
        setSelectedComplaint(null);
        setResolutionNotes('');
        await fetchComplaints();
        alert(`Grievance #${res.complaint.code} updated to status: ${targetStatus}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/society" className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Society Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Cooperative Grievance & Dispute Board</h1>
          <p className="text-xs text-slate-500">
            Formal dispute resolution workflow mandated under cooperative governance.
          </p>
        </div>

        <button
          onClick={fetchComplaints}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Complaints Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">
            Active Grievances & Disputes ({complaints.length})
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No active complaints logged.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedComplaint(c);
                    setResolutionNotes(c.resolutionNotes || '');
                  }}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedComplaint?.id === c.id ? 'bg-blue-50/70 border-l-4 border-blue-900' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-blue-900">#{c.code || c.id}</span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {c.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            c.status === 'Closed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium mt-1">{c.description}</p>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Raised by: <strong>{c.customerName}</strong> against <strong>{c.workerName}</strong>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dispute Resolution Action Panel */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Dispute Action Panel
          </h3>

          {!selectedComplaint ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Select a grievance record from the list to review and resolve.
            </div>
          ) : (
            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">Reviewing #{selectedComplaint.code}</div>
                <div className="text-[11px] text-slate-500">
                  Current Status: <strong className="text-blue-900">{selectedComplaint.status}</strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Advance Dispute Stage</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Society Review">Society Review</option>
                  <option value="Investigation">Investigation</option>
                  <option value="Resolution">Resolution</option>
                  <option value="Closed">Closed & Settled</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Resolution Notes</label>
                <textarea
                  rows="4"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Record society committee findings, conciliation details, or refund notes..."
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white py-2.5 rounded-lg font-bold text-xs shadow-sm"
              >
                Update Dispute Stage
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
