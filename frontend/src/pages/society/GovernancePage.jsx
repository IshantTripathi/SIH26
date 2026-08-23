import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Vote, BookOpen, Calendar, Users, CheckCircle2, Clock, FileText, Plus } from 'lucide-react';

export function GovernancePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('meetings');
  const [meetings, setMeetings] = useState([]);
  const [bylaws, setBylaws] = useState([]);
  const [resolutions, setResolutions] = useState([]);
  const [participation, setParticipation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', description: '', scheduledDate: '', scheduledTime: '', location: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [mRes, bRes, rRes, pRes] = await Promise.all([
        api.getGovernanceMeetings(),
        api.getGovernanceBylaws(),
        api.getGovernanceResolutions(),
        api.getGovernanceParticipation()
      ]);
      if (mRes.success) setMeetings(mRes.meetings);
      if (bRes.success) setBylaws(bRes.bylaws);
      if (rRes.success) setResolutions(rRes.resolutions);
      if (pRes.success) setParticipation(pRes);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreateMeeting = async () => {
    if (!newMeeting.title || !newMeeting.scheduledDate) return alert('Title and date required');
    try {
      await api.createGovernanceMeeting(newMeeting);
      setShowCreateMeeting(false);
      setNewMeeting({ title: '', description: '', scheduledDate: '', scheduledTime: '', location: '' });
      fetchAll();
    } catch (e) { alert(e.message); }
  };

  const handleVoteResolution = async (id, vote) => {
    try { await api.voteGovernanceResolution(id, vote); fetchAll(); } catch (e) { alert(e.message); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading governance data...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-[#0f2e5a] to-[#1a4b8c] text-white rounded-2xl p-6">
        <h1 className="text-lg font-bold flex items-center gap-2"><Vote className="w-5 h-5" /> Cooperative Governance & Decision System</h1>
        <p className="text-xs text-blue-200 mt-1">Meetings, bylaws, resolutions, participation tracking — democratic cooperative management.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {[{id:'meetings',label:'Meetings',icon:Calendar},{id:'bylaws',label:'Bylaws',icon:BookOpen},{id:'resolutions',label:'Resolutions',icon:FileText},{id:'participation',label:'Participation',icon:Users}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'meetings' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowCreateMeeting(!showCreateMeeting)} className="bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Schedule Meeting
            </button>
          </div>
          {showCreateMeeting && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <input placeholder="Meeting Title" value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg" />
                <input type="date" value={newMeeting.scheduledDate} onChange={e => setNewMeeting({...newMeeting, scheduledDate: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg" />
                <input type="time" value={newMeeting.scheduledTime} onChange={e => setNewMeeting({...newMeeting, scheduledTime: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg" />
                <input placeholder="Location" value={newMeeting.location} onChange={e => setNewMeeting({...newMeeting, location: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <textarea placeholder="Description" value={newMeeting.description} onChange={e => setNewMeeting({...newMeeting, description: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" rows={2} />
              <button onClick={handleCreateMeeting} className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-bold">Create Meeting</button>
            </div>
          )}
          {meetings.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No meetings scheduled yet.</p>
          ) : meetings.map(m => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{m.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>{m.status}</span>
              </div>
              <div className="text-xs text-slate-500 flex gap-4">
                <span>{m.scheduledDate} {m.scheduledTime}</span>
                <span>{m.location}</span>
              </div>
              {m.description && <p className="text-xs text-slate-600">{m.description}</p>}
              {m.minutes && <div className="p-2 bg-slate-50 rounded-lg text-xs text-slate-700"><strong>Minutes:</strong> {m.minutes}</div>}
            </div>
          ))}
        </div>
      )}

      {tab === 'bylaws' && (
        <div className="space-y-3">
          {bylaws.map(b => (
            <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-slate-900">{b.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{b.category}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{b.status}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600">{b.description}</p>
              <div className="text-[10px] text-slate-400 mt-1">v{b.version} • Effective {b.effectiveDate}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'resolutions' && (
        <div className="space-y-3">
          {resolutions.length === 0 ? <p className="text-xs text-slate-400 text-center py-8">No resolutions yet.</p> : resolutions.map(r => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{r.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : r.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{r.status}</span>
              </div>
              <p className="text-xs text-slate-600">{r.description}</p>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-emerald-700 font-bold">For: {r.votesFor}</span>
                <span className="text-red-700 font-bold">Against: {r.votesAgainst}</span>
                <span className="text-slate-500">Quorum: {r.totalEligible}</span>
              </div>
              {r.status === 'Proposed' && (
                <div className="flex gap-2">
                  <button onClick={() => handleVoteResolution(r.id, 'for')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-[10px] font-bold">Vote For</button>
                  <button onClick={() => handleVoteResolution(r.id, 'against')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-[10px] font-bold">Vote Against</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'participation' && participation && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
              <div className="text-2xl font-bold text-blue-800">{participation.summary.totalMeetings}</div>
              <div className="text-[10px] text-blue-600">Total Meetings</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <div className="text-2xl font-bold text-emerald-800">{participation.summary.totalResolutions}</div>
              <div className="text-[10px] text-emerald-600">Resolutions</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
              <div className="text-2xl font-bold text-amber-800">{participation.summary.approvedResolutions}</div>
              <div className="text-[10px] text-amber-600">Approved</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
              <div className="text-2xl font-bold text-purple-800">{participation.summary.totalProposals}</div>
              <div className="text-[10px] text-purple-600">Proposals</div>
            </div>
          </div>
          {participation.participation.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 mb-3">Member Participation Log</h3>
              {participation.participation.map(p => (
                <div key={p.workerId} className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                  <span className="font-bold text-slate-900">{p.workerId}</span>
                  <span>{p.meetingsAttended}/{p.meetingsTotal} meetings ({p.participationRate}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
