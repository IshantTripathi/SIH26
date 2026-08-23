import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Briefcase,
  ShieldCheck,
  Award,
  Activity,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Power,
  ShieldAlert
} from 'lucide-react';
import { StatCard, WorkloadBadge } from '../../components/common/StatCard';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

export function WorkerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [welfare, setWelfare] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [updatingJobId, setUpdatingJobId] = useState(null);
  const [sosModalJob, setSosModalJob] = useState(null);
  const [sosMessage, setSosMessage] = useState('');

  useEffect(() => {
    fetchWorkerData();
    const interval = setInterval(fetchWorkerData, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchWorkerData = async () => {
    try {
      const pRes = await api.getWorkerProfile();
      if (pRes.success) {
        setProfile(pRes.worker);
        setWelfare(pRes.welfare);
        setIsOnline(pRes.worker.isOnline);
      }
      const jRes = await api.getJobs();
      if (jRes.success) {
        setJobs(jRes.jobs);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleToggleOnline = async () => {
    setTogglingStatus(true);
    try {
      const nextState = !isOnline;
      const res = await api.updateWorkerStatus({ isOnline: nextState });
      if (res.success) {
        setIsOnline(nextState);
        fetchWorkerData();
      }
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
    setTogglingStatus(false);
  };

  // State progression
  const handleAdvanceJob = async (jobId, targetStatus) => {
    setUpdatingJobId(jobId);
    try {
      const payload = { status: targetStatus };
      if (targetStatus === 'COMPLETED') {
        payload.otpInput = otpInput;
      }
      const res = await api.updateJobStatus(jobId, payload);
      if (res.success) {
        setOtpInput('');
        await fetchWorkerData();
        if (targetStatus === 'COMPLETED') {
          try {
            confetti({ particleCount: 60, spread: 60 });
          } catch (e) {}
        }
      }
    } catch (err) {
      alert(`Error updating job: ${err.message}`);
    }
    setUpdatingJobId(null);
  };

  const handleSos = async () => {
    if (!sosModalJob) return;
    try {
      const res = await api.sendSosAlert(sosModalJob.id, { type: 'worker', message: sosMessage || 'Worker emergency assistance needed' });
      if (res.success) {
        setSosModalJob(null);
        setSosMessage('');
        alert('SOS alert sent! Society Admin & Federation Admin have been notified.');
      }
    } catch (err) { alert(err.message); }
  };

  // Punctuality calculation
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED');
  let onTimeCount = 0;
  for (const j of completedJobs) {
    const history = j.statusHistory || [];
    const accepted = history.find(h => h.status === 'ACCEPTED');
    const arrived = history.find(h => h.status === 'ARRIVED');
    if (accepted?.timestamp && arrived?.timestamp) {
      const diffMin = (new Date(arrived.timestamp) - new Date(accepted.timestamp)) / 60000;
      if (diffMin <= 20) onTimeCount++;
    }
  }
  const punctualityPercent = completedJobs.length > 0 ? Math.round((onTimeCount / completedJobs.length) * 100) : 100;

  const activeJob = jobs.find(
    (j) =>
      j.status === 'ACCEPTED' ||
      j.status === 'ON_THE_WAY' ||
      j.status === 'ARRIVED' ||
      j.status === 'IN_PROGRESS'
  );

  const incomingOffers = jobs.filter((j) => j.status === 'OFFERED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
              {t('worker.title', 'Worker Hub')}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ID: {profile?.code || 'WORKER-DEMO-001'} (Demo)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {profile?.name || user?.name || 'Worker Demo 01'}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="font-semibold text-blue-900">Trade: {profile?.primarySkill}</span>
            <span>•</span>
            <span>Experience: {profile?.experienceYears} Years</span>
            <span>•</span>
            <WorkloadBadge status={profile?.currentWorkload} count={profile?.activeJobsCount} />
          </div>
        </div>

        {/* Online / Offline Duty Switch */}
        <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800">
              {isOnline ? t('worker.onDuty', 'Online & Available') : t('worker.offDuty', 'Offline / Off-Duty')}
            </div>
            <div className="text-[10px] text-slate-500">
              {isOnline ? 'Receiving cooperative job matches' : 'Will not receive job dispatches'}
            </div>
          </div>
          <button
            onClick={handleToggleOnline}
            disabled={togglingStatus}
            className={`p-3 rounded-xl transition-all shadow-sm flex items-center justify-center ${
              isOnline
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-100'
                : 'bg-slate-300 hover:bg-slate-400 text-slate-700'
            }`}
            title="Toggle duty status"
          >
            <Power className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Workload"
          value={`${profile?.activeJobsCount || 0} Jobs`}
          subtitle={profile?.currentWorkload || 'Balanced'}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title={t('worker.grossEarnings', 'Total Gross Value')}
          value={`₹${profile?.totalEarningsGross || 14200}`}
          subtitle="95% direct net payout"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Worker Rating"
          value={`${profile?.ratingAvg || 4.85} ★`}
          subtitle={`Based on ${profile?.ratingCount || 28} verified reviews`}
          icon={Award}
          color="amber"
        />
        <StatCard
          title="Punctuality"
          value={`${punctualityPercent}%`}
          subtitle={`On-time arrivals (${onTimeCount}/${completedJobs.length || 0})`}
          icon={Clock}
          color={punctualityPercent >= 90 ? 'green' : 'amber'}
        />
        <StatCard
          title={t('worker.welfare', 'Welfare Shield')}
          value="Policy Active"
          subtitle="Demo Welfare Record (INS-DEMO-001)"
          icon={ShieldCheck}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Job Lifecycle + Incoming Offers (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Incoming Job Offers (If Any) */}
          {incomingOffers.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm space-y-4 animate-pulse">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <h3 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700" />
                  {t('worker.incomingOffers', 'Incoming Job Offers')}
                </h3>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded">
                  Action Required
                </span>
              </div>

              {incomingOffers.map((offer) => (
                <div key={offer.id} className="space-y-3 bg-white p-4 rounded-xl border border-amber-200">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{offer.serviceCategory}</div>
                      <div className="text-xs text-slate-600">{offer.problemDescription}</div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {offer.customerAddress}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Net Worker Pay</div>
                      <div className="text-base font-bold text-emerald-800 font-mono">
                        ₹{offer.pricing?.netWorkerEarnings || 475}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                    <button onClick={async()=>{try{await api.declineJobOffer(offer.id,{reason:'Worker busy'}); await fetchWorkerData();}catch(e){alert(e.message)}} } className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-slate-200">Decline</button>
                    <button
                      onClick={() => handleAdvanceJob(offer.id, 'ACCEPTED')}
                      disabled={updatingJobId === offer.id}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                    >
                      {updatingJobId === offer.id ? 'Accepting...' : t('worker.acceptOffer', 'Accept Job Offer')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Job Execution Workflow */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-800" />
                {t('worker.activeJobs', 'Jobs In Progress')}
              </h2>
              {activeJob && (
                <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded uppercase">
                  {activeJob.status.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            {!activeJob ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">No job in active execution.</p>
                <p>Ensure your status is set to "On-Duty" to receive nearby service dispatches.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-bold text-base text-slate-900">{activeJob.serviceTitle}</div>
                      <div className="text-xs text-slate-600">{activeJob.problemDescription}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Net Pay</div>
                      <div className="text-base font-bold text-emerald-800 font-mono">
                        ₹{activeJob.pricing?.netWorkerEarnings || 475}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 text-slate-600">
                    <div>
                      <strong>Customer / Type:</strong> {activeJob.customerName} {activeJob.customerType === 'Institution' ? '(Institution)' : '(Household)'}
                    </div>
                    <div>
                      <strong>Address:</strong> {activeJob.customerAddress}
                    </div>
                  </div>
                </div>

                {/* Step Progression Visualizer */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase">
                    Step-by-Step Status Verification:
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
                    <div
                      className={`p-2 rounded-lg border ${
                        activeJob.status === 'ACCEPTED'
                          ? 'bg-blue-900 text-white font-bold'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      1. Accepted
                    </div>
                    <div
                      className={`p-2 rounded-lg border ${
                        activeJob.status === 'ON_THE_WAY'
                          ? 'bg-blue-900 text-white font-bold'
                          : activeJob.status === 'ARRIVED' || activeJob.status === 'IN_PROGRESS'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      2. On The Way
                    </div>
                    <div
                      className={`p-2 rounded-lg border ${
                        activeJob.status === 'ARRIVED'
                          ? 'bg-blue-900 text-white font-bold'
                          : activeJob.status === 'IN_PROGRESS'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      3. Arrived
                    </div>
                    <div
                      className={`p-2 rounded-lg border ${
                        activeJob.status === 'IN_PROGRESS'
                          ? 'bg-blue-900 text-white font-bold animate-pulse'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      4. In Progress
                    </div>
                  </div>
                </div>

                {/* State Transition Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                  <button
                    onClick={() => { setSosModalJob(activeJob); setSosMessage(''); }}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200 flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    SOS Emergency
                  </button>
                  <div className="flex items-center gap-2">
                  {activeJob.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleAdvanceJob(activeJob.id, 'ON_THE_WAY')}
                      disabled={updatingJobId === activeJob.id}
                      className="w-full sm:w-auto bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>{t('worker.onWay', 'Mark On The Way')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {activeJob.status === 'ON_THE_WAY' && (
                    <button
                      onClick={() => handleAdvanceJob(activeJob.id, 'ARRIVED')}
                      disabled={updatingJobId === activeJob.id}
                      className="w-full sm:w-auto bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>{t('worker.arrived', 'Mark Arrived at Location')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {activeJob.status === 'ARRIVED' && (
                    <button
                      onClick={() => handleAdvanceJob(activeJob.id, 'IN_PROGRESS')}
                      disabled={updatingJobId === activeJob.id}
                      className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>{t('worker.startWork', 'Start Service In Progress')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {activeJob.status === 'IN_PROGRESS' && (
                    <div className="w-full space-y-2 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                      <label className="block text-xs font-bold text-emerald-950">
                        {t('worker.completeJob', 'Enter Customer OTP to Complete Job')}:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          placeholder="e.g. 4821"
                          maxLength={4}
                          className="px-3 py-1.5 border border-emerald-300 rounded-lg text-xs font-mono font-bold tracking-widest bg-white"
                        />
                        <button
                          onClick={() => handleAdvanceJob(activeJob.id, 'COMPLETED')}
                          disabled={updatingJobId === activeJob.id || otpInput.length < 4}
                          className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                        >
                          Verify & Complete
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Skill Certifications & Welfare Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Skill & Certification Portfolio */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                Verified Skill Credentials
              </h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                Verified (Demo)
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">
                  {profile?.certifications?.[0]?.title || 'Certified Trade Certificate'}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Issued by: {profile?.certifications?.[0]?.issuedBy || 'Cooperative Skill Verification Board'}
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span className="font-mono text-slate-500">
                    Badge: {profile?.certifications?.[0]?.code || 'CERT-DEMO-002'}
                  </span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Society Verified
                  </span>
                </div>
              </div>

              <div className="text-slate-600 text-[11px] space-y-1">
                <div>
                  <strong>Primary Skill:</strong> {profile?.primarySkill}
                </div>
                <div>
                  <strong>Secondary Skills:</strong> {profile?.secondarySkills?.join(', ') || 'General Maintenance'}
                </div>
                <div>
                  <strong>Service Coverage:</strong> {profile?.serviceAreas?.join(', ') || 'Central Metro'}
                </div>
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1">Verifiable Skill Passport <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">NCCT QR</span></div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-16 h-16 bg-white border-2 border-slate-800 rounded flex items-center justify-center text-[7px] font-mono text-center p-1">
                      QR<br/>{profile?.certifications?.[0]?.code || 'CERT-DEMO-002'}<br/>✓ Verified
                    </div>
                    <div className="flex-1">
                      <div className="font-mono text-[10px] break-all bg-slate-100 p-1 rounded">{profile?.certifications?.[0]?.code || 'CERT-DEMO-002'}|{profile?.code}|hash</div>
                      <button onClick={async()=>{
                        try{
                          const code=profile?.certifications?.[0]?.code;
                          if(!code) return alert('No cert code');
                          const r=await api.verifyCert(code);
                          alert(r.verified ? `✓ Verified: ${r.holder.name} — ${r.certificate.title} (${r.certificate.code})` : 'Not verified');
                        }catch(e){alert(e.message)}
                      }} className="mt-1 text-[11px] bg-blue-900 text-white px-2 py-0.5 rounded font-bold">Verify Now</button>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400">Customer scans QR to verify on cooperative registry — portable across societies.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Worker Welfare & Insurance Snapshot */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                {t('worker.welfare', 'Worker Welfare & Insurance')}
              </h2>
              <Link to="/worker/welfare" className="text-xs text-blue-900 font-bold hover:underline">
                View Full Hub →
              </Link>
            </div>

            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-2">
              <div className="flex justify-between font-bold text-emerald-950">
                <span>{welfare?.welfareSchemeName || 'Demo Cooperative Worker Welfare Program'}</span>
                <span className="bg-emerald-200 text-emerald-900 px-2 py-0.2 rounded text-[10px]">Active</span>
              </div>
              <div className="text-slate-600 text-[11px]">
                Policy Identifier: <strong className="font-mono text-slate-800">{welfare?.insurancePolicyNumber || 'INS-DEMO-001'}</strong>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-semibold text-emerald-900">
                <div>Health Cover: ₹{welfare?.coverageAmount || 200000}</div>
                <div>Accidental Shield: ₹{welfare?.accidentalCoverage || 300000}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SOS Modal */}
      {sosModalJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-red-300 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-red-700 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              SOS Emergency Alert
            </h3>
            <p className="text-xs text-slate-600">
              This will immediately notify the <strong>Society Admin</strong> and <strong>Federation Admin</strong>. A field team will be dispatched.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Message (optional)</label>
              <textarea
                rows="2"
                value={sosMessage}
                onChange={(e) => setSosMessage(e.target.value)}
                placeholder="Describe the emergency..."
                className="w-full px-3 py-2 border border-red-300 rounded-lg text-xs"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setSosModalJob(null)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
              <button onClick={handleSos} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Send SOS Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default WorkerDashboard;
