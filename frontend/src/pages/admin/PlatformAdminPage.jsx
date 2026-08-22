import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Sliders, Plus, ShieldCheck, FileText, Search, RefreshCw, Layers } from 'lucide-react';

export function PlatformAdminPage() {
  const [services, setServices] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);

  // New Service Form
  const [newCat, setNewCat] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newBasePrice, setNewBasePrice] = useState('500');
  const [newKeywords, setNewKeywords] = useState('');

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    setLoading(true);
    try {
      const sRes = await api.getServices();
      if (sRes.success) setServices(sRes.services || []);

      const aRes = await api.getAuditLogs();
      if (aRes.success) setAuditLogs(aRes.logs || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addService({
        category: newCat,
        title: newTitle,
        basePrice: Number(newBasePrice),
        keywords: newKeywords.split(',').map(k => k.trim())
      });
      if (res.success) {
        setServiceModalOpen(false);
        setNewCat('');
        setNewTitle('');
        setNewKeywords('');
        await fetchSystemData();
        alert('New service trade category registered into cooperative catalogue.');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-purple-100 text-purple-900 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
              Platform Administration
            </span>
            <span className="text-xs text-slate-500 font-medium">System Configuration & Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Platform Governance & Master Catalogue</h1>
          <p className="text-xs text-slate-500">
            Ministry of Cooperation platform registry, master service definitions, and transactional audit trails.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchSystemData}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={() => setServiceModalOpen(true)}
            className="px-4 py-2 bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Trade Category
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Master Services Catalogue (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-700" />
              Master Service Categories ({services.length})
            </h2>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              Standard Rates
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs max-h-96 overflow-y-auto">
            {services.map((s) => (
              <div key={s.id} className="py-3 flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900">{s.category}</div>
                  <div className="text-slate-600 text-[11px]">{s.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Keywords: {s.keywords?.slice(0, 4).join(', ')}...
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-blue-900">
                  ₹{s.basePrice}
                  <span className="block text-[9px] text-slate-400 font-normal">Base / Inspection</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Immutable Audit Trail (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Platform Audit Trail Ledger
            </h2>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
              Live Audits
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs max-h-96 overflow-y-auto font-mono">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded">
                    {log.action}
                  </span>
                  <span className="text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-slate-800 font-sans text-xs">{log.details}</div>
                <div className="text-[10px] text-slate-400">
                  Actor: <strong className="text-slate-600">{log.actorName}</strong> ({log.actorRole}) • Module: {log.module}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Service Modal */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Add New Cooperative Service Category</h3>

            <form onSubmit={handleAddService} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trade Category Name</label>
                <input
                  type="text"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  placeholder="e.g. Solar Panel Technician"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Display Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Solar PV Maintenance & Inverter Services"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Standard Base Price (₹)</label>
                <input
                  type="number"
                  value={newBasePrice}
                  onChange={(e) => setNewBasePrice(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keywords for Problem Classifier (comma-separated)</label>
                <input
                  type="text"
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                  placeholder="solar, inverter, panel, rooftop, battery"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white font-bold rounded-lg shadow-sm"
                >
                  Save Service Trade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
