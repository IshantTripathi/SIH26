import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Search,
  Sparkles,
  ShieldCheck,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  CreditCard,
  Star,
  FileText,
  AlertCircle,
  Activity,
  ArrowRight,
  RefreshCw,
  Building,
  Home
} from 'lucide-react';
import { AllocationBreakdown } from '../../components/allocation/AllocationBreakdown';
import { InvoiceModal } from '../../components/common/InvoiceModal';
import { LeafletCoopMap } from '../../components/map/LeafletCoopMap';
import confetti from 'canvas-confetti';

export function CustomerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Customer Type state
  const [customerType, setCustomerType] = useState(
    location.state?.customerType || user?.customerType || 'Household'
  );
  const [institutionName, setInstitutionName] = useState(user?.institutionName || '');
  const [institutionType, setInstitutionType] = useState(user?.institutionType || 'Clinic / Healthcare Facility');
  const [contactPerson, setContactPerson] = useState(user?.contactPerson || '');

  // Form states
  const [problemDescription, setProblemDescription] = useState(
    location.state?.problemQuery || ''
  );
  const [detectedCategory, setDetectedCategory] = useState(
    location.state?.prefilledIntent?.serviceCategory || location.state?.prefilledCategory || ''
  );
  const [urgency, setUrgency] = useState('Normal');
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState('Immediately / As soon as available');
  const [customerAddress, setCustomerAddress] = useState(
    user?.address || 'B-42, Metro Residency, Connaught Place'
  );

  // Intent classification
  const [isClassifying, setIsClassifying] = useState(false);
  const [intentData, setIntentData] = useState(location.state?.prefilledIntent || null);

  // Booking & Live Jobs
  const [submittingJob, setSubmittingJob] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [latestAllocationResult, setLatestAllocationResult] = useState(null);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Modals
  const [selectedInvoiceJob, setSelectedInvoiceJob] = useState(null);
  const [contactModalJob, setContactModalJob] = useState(null);
  const [ratingModalJob, setRatingModalJob] = useState(null);
  const [paymentModalJob, setPaymentModalJob] = useState(null);
  const [complaintModalJob, setComplaintModalJob] = useState(null);

  // Rating form
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('Excellent certified cooperative workmanship.');

  // Complaint form
  const [complaintCategory, setComplaintCategory] = useState('Service Quality');
  const [complaintDesc, setComplaintDesc] = useState('');

  // Payment form
  const [paymentMethod, setPaymentMethod] = useState('UPI Demo');

  useEffect(() => {
    fetchActiveJobs();
    const interval = setInterval(fetchActiveJobs, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveJobs = async () => {
    try {
      const res = await api.getJobs();
      if (res.success) {
        setActiveJobs(res.jobs);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingJobs(false);
  };

  // Real-time intent classification
  const handleProblemChange = async (val) => {
    setProblemDescription(val);
    setBookingError(null);
    setBookingSuccess(null);
    if (val.length > 5) {
      setIsClassifying(true);
      try {
        const res = await api.classifyIntent(val);
        if (res.success && res.intent) {
          setIntentData(res.intent);
          setDetectedCategory(res.intent.serviceCategory);
          if (res.intent.suggestedUrgency) {
            setUrgency(res.intent.suggestedUrgency);
          }
        }
      } catch (err) {
        console.error(err);
      }
      setIsClassifying(false);
    }
  };

  // Submit service booking
  const handleBookService = async (e) => {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    if (!problemDescription.trim()) {
      setBookingError('Please describe your service requirement.');
      return;
    }

    setSubmittingJob(true);
    try {
      const res = await api.createJobRequest({
        customerType,
        institutionName: customerType === 'Institution' ? (institutionName || 'Demo Institution') : null,
        institutionType: customerType === 'Institution' ? institutionType : null,
        contactPerson: customerType === 'Institution' ? contactPerson : null,
        serviceCategory: detectedCategory || 'General Maintenance',
        problemDescription,
        urgency,
        scheduledDate,
        scheduledTime,
        customerAddress,
        customerLocation: user?.location || { lat: 28.6140, lng: 77.2095 }
      });

      if (res.success) {
        setLatestAllocationResult(res.allocationResult);
        setBookingSuccess(`Service request created successfully! Matched worker: ${res.job?.workerName || 'Worker Assigned'}`);
        await fetchActiveJobs();
        try {
          confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
        } catch (e) {}
      } else {
        setBookingError(res.message || 'Unable to create service request. Please try again.');
      }
    } catch (err) {
      console.error('[Customer Booking Error]:', err);
      setBookingError(err.message || 'Unable to create service request. Please try again.');
    }
    setSubmittingJob(false);
  };

  // Pay for job
  const handleProcessPayment = async () => {
    if (!paymentModalJob) return;
    try {
      const res = await api.processPayment(paymentModalJob.id, { paymentMethod });
      if (res.success) {
        setPaymentModalJob(null);
        setSelectedInvoiceJob(res.job);
        await fetchActiveJobs();
        try {
          confetti({ particleCount: 70, spread: 60 });
        } catch (e) {}
      }
    } catch (err) {
      alert(`Payment error: ${err.message}`);
    }
  };

  // Submit rating
  const handleSubmitRating = async () => {
    if (!ratingModalJob) return;
    try {
      const res = await api.submitRating(ratingModalJob.id, {
        score: ratingScore,
        comment: ratingComment
      });
      if (res.success) {
        setRatingModalJob(null);
        await fetchActiveJobs();
        alert('Thank you! Your feedback supports fair cooperative worker ratings.');
      }
    } catch (err) {
      alert(`Rating error: ${err.message}`);
    }
  };

  // Submit complaint
  const handleSubmitComplaint = async () => {
    if (!complaintModalJob) return;
    try {
      const res = await api.createComplaint({
        jobId: complaintModalJob.id,
        category: complaintCategory,
        description: complaintDesc,
        priority: 'High'
      });
      if (res.success) {
        setComplaintModalJob(null);
        setComplaintDesc('');
        alert('Grievance logged with the Cooperative Society Grievance Board (ID: ' + res.complaint.code + ').');
      }
    } catch (err) {
      alert(`Complaint error: ${err.message}`);
    }
  };

  const handleCancelJob = async (jobId) => {
    if (!window.confirm('Cancel this booking? Worker will be released.')) return;
    try {
      await api.cancelJob(jobId, { reason: 'Customer cancelled from dashboard' });
      await fetchActiveJobs();
    } catch (err) { alert(err.message); }
  };

  const handleResendOtp = async (jobId) => {
    try {
      const res = await api.resendOtp(jobId);
      if (res.success) { alert(`New OTP: ${res.otp} — share only at service completion.`); await fetchActiveJobs(); }
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-900 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
              {t('customer.title', 'Customer Portal')}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {customerType === 'Institution' ? 'Institution Service Portal' : 'Household Service Portal'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Welcome, {user?.name || 'Customer Demo 01'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Location: <span className="font-semibold text-slate-700">{customerAddress}</span> (Central Metro District)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchActiveJobs}
            className="p-2 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200"
            title="Refresh job status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/customer/bookings')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
          >
            {t('customer.pastBookings', 'Booking History')} ({activeJobs.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Problem-First Booking Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border-2 border-blue-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                {t('customer.title', 'Request a Cooperative Service')}
              </h2>
              <span className="text-[11px] bg-blue-50 text-blue-900 font-bold px-2 py-0.5 rounded">
                Fair Work Allocation Engine
              </span>
            </div>

            <form onSubmit={handleBookService} className="space-y-4 text-xs">
              {/* Customer Type Selector (Household vs Institution) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  {t('customer.typeLabel', 'Customer / Requester Type')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomerType('Household')}
                    className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 text-xs transition-all ${
                      customerType === 'Household'
                        ? 'bg-blue-900 text-white border-blue-950 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>{t('customer.household', 'Household (Residential)')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomerType('Institution')}
                    className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 text-xs transition-all ${
                      customerType === 'Institution'
                        ? 'bg-blue-900 text-white border-blue-950 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>{t('customer.institution', 'Institution / Facility')}</span>
                  </button>
                </div>
              </div>

              {/* Institution Specific Fields */}
              {customerType === 'Institution' && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-blue-800" />
                    <span>Institutional Facility Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {t('customer.instName', 'Institution / Facility Name')}
                      </label>
                      <input
                        type="text"
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        placeholder="e.g. Community Health Centre (Demo)"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        required={customerType === 'Institution'}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {t('customer.instType', 'Facility Type')}
                      </label>
                      <select
                        value={institutionType}
                        onChange={(e) => setInstitutionType(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      >
                        <option value="Clinic / Healthcare Facility">Clinic / Healthcare Facility</option>
                        <option value="School / Educational Institute">School / Educational Institute</option>
                        <option value="Community Centre / Hall">Community Centre / Hall</option>
                        <option value="Office / Commercial Facility">Office / Commercial Facility</option>
                        <option value="Cooperative Facility">Cooperative Facility</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {t('customer.contactPerson', 'Authorized Contact Person / Designation')}
                    </label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g. Administrative Officer 01"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Problem Description Input with Voice */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>{t('customer.describeProblem', 'Describe the Problem in Your Words')}</span>
                  <button type="button" onClick={()=>{
                    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                    if(!SR){ alert('Voice not supported in this browser'); return; }
                    const rec = new SR(); rec.lang = 'hi-IN'; rec.interimResults=false; rec.maxAlternatives=1;
                    rec.onresult = (e)=>{ const t=e.results[0][0].transcript; handleProblemChange(t); };
                    rec.onerror=()=>{}; rec.start();
                  }} className="text-[11px] bg-slate-100 hover:bg-amber-50 border border-slate-300 px-2 py-0.5 rounded flex items-center gap-1">🎙️ Voice (हिन्दी/EN)</button>
                </label>
                <textarea
                  rows="3"
                  value={problemDescription}
                  onChange={(e) => handleProblemChange(e.target.value)}
                  placeholder='e.g., "I have a leaking kitchen tap under the sink" or "Ceiling fan making strange grinding noise" or "Need elder caregiving daytime support" — or tap 🎙️ and speak in Hindi/English'
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-sm bg-white"
                />
                <div className="text-[11px] text-slate-400 mt-1">
                  No need to know trade jargon. Our problem classifier identifies the certified trade automatically. Voice supports Hindi + English offline queue via PWA.
                </div>
              </div>

              {/* Automatic Classifier Feedback */}
              {intentData && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between animate-in fade-in">
                  <div>
                    <div className="text-emerald-950 font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Classified Trade: <span className="font-extrabold text-emerald-800">{intentData.serviceCategory}</span>
                    </div>
                    <div className="text-slate-600 text-[11px] mt-0.5">
                      {intentData.serviceTitle} • Est. Base: ₹{intentData.basePrice}
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-bold px-2 py-0.5 rounded">
                    {Math.round(intentData.confidence * 100)}% Confidence Match
                  </span>
                </div>
              )}

              {/* Trade Category Selection Override */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('customer.selectService', 'Service Trade')} (Auto-Detected / Editable)
                  </label>
                  <select
                    value={detectedCategory}
                    onChange={(e) => setDetectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">-- Select or Type Above --</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Appliance Repair">Appliance Repair</option>
                    <option value="Painting">Painting</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Gardening">Gardening</option>
                    <option value="Caregiving">Caregiving</option>
                    <option value="Driving">Driving</option>
                    <option value="General Maintenance">General Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('customer.urgency', 'Urgency Priority')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Normal', 'High', 'Emergency'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUrgency(u)}
                        className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                          urgency === u
                            ? u === 'Emergency'
                              ? 'bg-red-600 text-white border-red-700'
                              : 'bg-blue-900 text-white border-blue-950'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {u === 'Normal' ? t('customer.normalUrgency', 'Normal') : u === 'High' ? t('customer.highUrgency', 'High') : t('customer.emergencyUrgency', 'Emergency')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Address & Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('customer.address', 'Service Location / Address')}</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheduled Date & Slot</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {t('common.demoDisclaimer', 'Demo contribution model — values are configurable and are not presented as statutory rates.')}
              </div>

              {bookingError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {bookingSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{bookingSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingJob}
                className="w-full bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-colors"
              >
                {submittingJob ? (
                  'Running Fair Allocation Engine...'
                ) : (
                  <>
                    <span>{t('customer.requestBtn', 'Submit & Match Verified Cooperative Worker')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Allocation Breakdown Preview If Just Generated */}
          {latestAllocationResult && latestAllocationResult.recommendedWorker && (
            <div className="bg-white border-2 border-emerald-300 rounded-2xl p-6 shadow-sm space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Fair Allocation Decision Breakdown
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  Optimal Match
                </span>
              </div>
              <AllocationBreakdown
                candidate={latestAllocationResult.recommendedWorker}
                isTop={true}
              />
              <button onClick={async()=>{
                try{
                  const r=await api.explainAllocation({serviceCategory:detectedCategory||'Plumbing'});
                  alert(`Explainable Twin:\nTop: ${r.recommended.workerName} (${r.recommended.totalScore})\nCounterfactual: ${r.counterfactual?.explanation || 'N/A'}\nNote: ${r.fairnessNote}`);
                }catch(e){alert(e.message)}
              }} className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 py-1.5 rounded-lg text-xs font-bold">🔍 Explainable Twin — Why this worker?</button>
            </div>
          )}
        </div>

        {/* Right Column: Active Jobs & Live Tracker (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-800" />
                {t('customer.activeBookings', 'Live Job Tracking')} ({activeJobs.filter(j => j.status !== 'PAID').length})
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            {loadingJobs ? (
              <div className="py-8 text-center text-xs text-slate-400">{t('common.loading', 'Loading active jobs...')}</div>
            ) : activeJobs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                <p>No active service requests right now.</p>
                <p className="text-[11px]">Submit a problem description to request a worker.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeJobs.map((job) => (
                  <div
                    key={job.id}
                    className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50 hover:bg-white transition-all shadow-2xs"
                  >
                    {/* Job Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">{job.serviceCategory}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              job.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : job.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : job.status === 'ACCEPTED' || job.status === 'ON_THE_WAY' || job.status === 'ARRIVED'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {job.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">#{job.code || job.id} {job.customerType === 'Institution' ? `• [${job.institutionName || 'Institution'}]` : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900 font-mono">
                          ₹{job.pricing?.grossAmount || 500}
                        </div>
                        <div className="text-[10px] text-slate-400">Coop Rate (Demo)</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">
                      {job.problemDescription}
                    </p>

                    {/* Assigned Worker Card */}
                    <div className="flex items-center justify-between text-xs bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Assigned Worker</div>
                        <div className="font-bold text-slate-900">{job.workerName}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setContactModalJob(job)}
                          className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-900 font-semibold rounded border border-blue-200 text-[11px] flex items-center gap-1"
                        >
                          <PhoneCall className="w-3 h-3" />
                          Contact
                        </button>
                      </div>
                    </div>

                    {/* Verification OTP Display */}
                    {job.status !== 'COMPLETED' && job.status !== 'PAID' && job.status !== 'CANCELLED' && job.otp && (
                      <div className="flex items-center justify-between text-xs bg-amber-50 p-2 rounded border border-amber-200 text-amber-900">
                        <span>{t('customer.otpCode', 'Customer Completion OTP')}:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-extrabold text-sm tracking-widest bg-white px-2 py-0.5 rounded border border-amber-300">
                            {job.otp}
                          </span>
                          <button onClick={() => handleResendOtp(job.id)} className="text-[11px] text-blue-700 underline">Resend</button>
                        </div>
                      </div>
                    )}

                    {/* Action buttons based on status */}
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      {['REQUESTED','MATCHING','OFFERED','ACCEPTED'].includes(job.status) && (
                        <button onClick={() => handleCancelJob(job.id)} className="text-[11px] text-red-600 hover:text-red-800 underline">Cancel Booking</button>
                      )}
                      {job.status === 'COMPLETED' && job.paymentStatus !== 'PAID' && (
                        <button
                          onClick={() => setPaymentModalJob(job)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          {t('customer.payNow', 'Pay')} ₹{job.pricing?.grossAmount || 500}
                        </button>
                      )}

                      {job.paymentStatus === 'PAID' && !job.rating && (
                        <button
                          onClick={() => setRatingModalJob(job)}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <Star className="w-3.5 h-3.5" />
                          {t('customer.rateWorker', 'Rate Service')}
                        </button>
                      )}

                      {job.paymentStatus === 'PAID' && (
                        <button
                          onClick={() => setSelectedInvoiceJob(job)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {t('customer.viewInvoice', 'Invoice')}
                        </button>
                      )}

                      <button
                        onClick={() => setComplaintModalJob(job)}
                        className="text-[11px] text-red-600 hover:text-red-800 underline ml-2"
                      >
                        Raise Complaint
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Geographic Map */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-700" />
                Local Cooperative Service Area
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Leaflet + OpenStreetMap</span>
            </div>
            <LeafletCoopMap
              customerLocation={{ lat: 28.6140, lng: 77.2095, area: 'Connaught Place' }}
              height="280px"
            />
          </div>
        </div>
      </div>

      {/* MODAL 1: Payment Modal */}
      {paymentModalJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Settle Cooperative Service Payment
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                Demo Payment Environment
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Payment is held in trust and disbursed according to transparent cooperative bye-laws.
            </p>

            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1.5 border border-slate-200">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Job Amount:</span>
                <span className="font-mono text-sm font-bold text-slate-900">₹{paymentModalJob.pricing?.grossAmount || 500}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Direct Worker Net Wage ({paymentModalJob.pricing?.netWorkerEarnings ? Math.round((paymentModalJob.pricing.netWorkerEarnings / paymentModalJob.pricing.grossAmount) * 100) : 95}%):</span>
                <span className="font-mono">₹{paymentModalJob.pricing?.netWorkerEarnings || 475}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Coop Welfare & Insurance Fund ({paymentModalJob.pricing?.welfarePercent || 1}%):</span>
                <span className="font-mono">₹{paymentModalJob.pricing?.welfareDeduction || 5}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Society Administration ({paymentModalJob.pricing?.coopPercent || 4}%):</span>
                <span className="font-mono">₹{paymentModalJob.pricing?.coopContribution || 20}</span>
              </div>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                {t('common.demoDisclaimer', 'Demo contribution model — values are configurable and are not presented as statutory rates.')}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Select Demo Payment Method</label>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                {['UPI Demo', 'Card Demo', 'Cash Demo'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 rounded-lg border text-center ${
                      paymentMethod === m
                        ? 'bg-blue-900 text-white border-blue-950'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setPaymentModalJob(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPayment}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
              >
                Confirm Payment (Demo)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Rating Modal */}
      {ratingModalJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Rate Worker Performance
            </h3>
            <p className="text-xs text-slate-500">
              Ratings are recorded in the Cooperative Society Audit Ledger for skill benchmarking.
            </p>

            <div className="flex items-center justify-center space-x-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingScore(star)}
                  className="p-1 text-2xl focus:outline-none"
                >
                  <span className={star <= ratingScore ? 'text-amber-500' : 'text-slate-200'}>
                    ★
                  </span>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback Comments</label>
              <textarea
                rows="2"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRatingModalJob(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0f2e5a] hover:bg-[#1a4b8c] rounded-lg shadow-sm"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Contact Modal */}
      {contactModalJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-blue-700" />
              Approved Contact Channel
            </h3>
            <p className="text-xs text-slate-600">
              For consumer safety, contact is bridged through the cooperative dispatch system.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-900 text-sm">{contactModalJob.workerName}</div>
              <div className="text-slate-500">Cooperative Society: Central Metro (SOC-DEMO-001)</div>
              <div className="font-mono text-blue-900 font-bold">
                Direct Line: {contactModalJob.workerPhone || '9876510001'} (Demo)
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setContactModalJob(null)}
                className="px-4 py-2 bg-[#0f2e5a] text-white text-xs font-semibold rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Raise Complaint */}
      {complaintModalJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Raise Grievance to Cooperative Society
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Grievance Category</label>
                <select
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Service Quality">Service Quality</option>
                  <option value="Billing Query">Billing Query</option>
                  <option value="Punctuality Issue">Punctuality Issue</option>
                  <option value="Worker Behavior">Worker Conduct</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Details of Complaint</label>
                <textarea
                  rows="3"
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  placeholder="Describe your issue clearly for society administrators..."
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setComplaintModalJob(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitComplaint}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Submit Grievance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Printable Cooperative Invoice */}
      <InvoiceModal
        job={selectedInvoiceJob}
        isOpen={!!selectedInvoiceJob}
        onClose={() => setSelectedInvoiceJob(null)}
      />
    </div>
  );
}
export default CustomerDashboard;
