import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  UserPlus, Award, CheckCircle2, AlertTriangle, ArrowRight, FileText,
  Phone, MapPin, Briefcase, Star, ShieldCheck, Clock
} from 'lucide-react';

export function WorkerApplicationPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState('apply');
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState([]);

  const [form, setForm] = useState({
    fullName: user?.name || '',
    mobile: user?.mobile || '',
    email: user?.email || '',
    primarySkill: 'Plumbing',
    secondarySkills: [],
    experienceYears: 1,
    aadhaarLast4: '',
    societyId: 'SOC-DEMO-001',
    address: '',
    bankAccountLast4: '',
    upiId: ''
  });
  const [applicationId, setApplicationId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [assessmentResult, setAssessmentResult] = useState(null);

  const trades = ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning', 'Gardening', 'Driving', 'Caregiving', 'General Maintenance'];

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.getMyApplications();
      if (res.success) setApplications(res.applications);
    } catch (e) {}
  };

  const handleSubmitApplication = async () => {
    if (!form.fullName || !form.mobile || !form.primarySkill) {
      alert('Please fill name, mobile, and primary skill.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.submitApplication(form);
      if (res.success) {
        setApplicationId(res.application.id);
        const qRes = await api.getAssessmentQuestions(form.primarySkill);
        if (qRes.success) {
          setQuestions(qRes.questions);
          setAnswers({});
          setStep('assess');
        }
      }
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  const handleSubmitAssessment = async () => {
    setLoading(true);
    try {
      const res = await api.submitAssessment({
        applicationId,
        trade: form.primarySkill,
        answers: questions.map((q, i) => answers[i] ?? -1)
      });
      if (res.success) {
        setAssessmentResult(res.result);
        setStep('result');
        fetchApplications();
      }
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  const score = assessmentResult ? Math.round((assessmentResult.correct / assessmentResult.total) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-[#0f2e5a] to-[#1a4b8c] text-white rounded-2xl p-6">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          {t('onboarding.apply', 'Apply as Cooperative Worker')}
        </h1>
        <p className="text-xs text-blue-200 mt-1">
          Complete the application and pass the skill assessment to become a verified cooperative member.
        </p>
      </div>

      {step === 'apply' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-700" />
            Step 1: Application Form
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile *</label>
              <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Skill *</label>
              <select value={form.primarySkill} onChange={e => setForm({...form, primarySkill: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                {trades.map(tr => <option key={tr} value={tr}>{tr}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Years of Experience</label>
              <input type="number" min="0" max="40" value={form.experienceYears}
                onChange={e => setForm({...form, experienceYears: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Aadhaar Last 4 Digits</label>
              <input maxLength="4" value={form.aadhaarLast4}
                onChange={e => setForm({...form, aadhaarLast4: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="XXXX" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address / Area</label>
              <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="e.g. Connaught Place, Delhi" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">UPI ID</label>
              <input value={form.upiId} onChange={e => setForm({...form, upiId: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="name@upi" />
            </div>
          </div>
          <button onClick={handleSubmitApplication} disabled={loading}
            className="bg-[#0f2e5a] hover:bg-[#1a4b8c] disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5" />
            {loading ? 'Submitting...' : 'Submit Application & Start Assessment'}
          </button>
        </div>
      )}

      {step === 'assess' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            Step 2: Skill Assessment — {form.primarySkill}
          </h2>
          <p className="text-[11px] text-slate-600">
            Answer {questions.length} questions. Minimum 60% required to pass. You have 1 attempt per application.
          </p>
          <div className="space-y-4">
            {questions.map((q, qi) => (
              <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-900">
                  Q{qi + 1}. {q.question}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">({q.difficulty})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <button key={oi} onClick={() => setAnswers({...answers, [qi]: oi})}
                      className={`text-left px-3 py-2 rounded-lg text-[11px] border transition-all ${
                        answers[qi] === oi
                          ? 'bg-blue-100 border-blue-500 text-blue-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}>
                      {String.fromCharCode(65 + oi)}. {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleSubmitAssessment} disabled={loading || Object.keys(answers).length < questions.length}
            className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {loading ? 'Submitting...' : `Submit Assessment (${Object.keys(answers).length}/${questions.length} answered)`}
          </button>
        </div>
      )}

      {step === 'result' && assessmentResult && (
        <div className={`border-2 rounded-2xl p-6 space-y-4 shadow-sm ${
          assessmentResult.passed ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'
        }`}>
          <h2 className={`text-sm font-bold flex items-center gap-1.5 ${
            assessmentResult.passed ? 'text-emerald-800' : 'text-red-800'
          }`}>
            {assessmentResult.passed ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {assessmentResult.passed ? 'ASSESSMENT PASSED' : 'ASSESSMENT FAILED'}
          </h2>
          <div className={`text-2xl font-bold ${assessmentResult.passed ? 'text-emerald-700' : 'text-red-700'}`}>
            {assessmentResult.correct}/{assessmentResult.total} Correct — {score}%
          </div>
          <p className="text-xs text-slate-700">
            {assessmentResult.passed
              ? 'Congratulations! Your application is now submitted for society admin review. You will be notified once verified.'
              : 'Minimum 60% required. You may re-apply after 7 days.'}
          </p>
          <button onClick={() => { setStep('apply'); setAssessmentResult(null); }}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold">
            Back to Applications
          </button>
        </div>
      )}

      {applications.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-500" />
            My Applications
          </h2>
          {applications.map(app => (
            <div key={app.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <div className="font-bold text-slate-900">{app.primarySkill} Application</div>
                <div className="text-slate-500">{app.fullName} | Score: {app.assessmentScore ?? 'N/A'}%</div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800'
                  : app.status === 'REJECTED' ? 'bg-red-100 text-red-800'
                  : app.status === 'ASSESSMENT_PASSED' ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {app.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
