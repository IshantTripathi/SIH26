import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Shield, CheckCircle, Lock, Smartphone, FileCheck, ArrowRight, ArrowLeft, Fingerprint, Award } from 'lucide-react';

export function AadhaarVerificationPage() {
  const [step, setStep] = useState(0);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadStatus(); }, []);

  const loadStatus = async () => {
    try {
      const res = await api.getAadhaarStatus();
      if (res.success) {
        setStatus(res);
        if (res.status === 'FULLY_VERIFIED') setStep(5);
        else if (res.status === 'AADHAAR_VERIFIED') setStep(3);
      }
    } catch (e) { /* ignore */ }
  };

  const handleInitiate = async () => {
    if (aadhaarNumber.length !== 12) { setError('Aadhaar must be 12 digits'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.initiateAadhaar({ aadhaarNumber, workerName });
      if (res.success) { setSessionId(res.sessionId); setStep(2); setSuccess(res.message); }
      else setError(res.message);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setError('OTP must be 6 digits'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.verifyAadhaarOtp({ sessionId, otp });
      if (res.success) { setStep(3); setSuccess('Aadhaar verified!'); loadStatus(); }
      else setError(res.message);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleDigiLocker = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.connectDigiLocker();
      if (res.success) { setStep(5); setSuccess('DigiLocker connected! All documents verified.'); loadStatus(); }
      else setError(res.message);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const steps = [
    { label: 'Enter Aadhaar', icon: Fingerprint },
    { label: 'OTP Verification', icon: Smartphone },
    { label: 'DigiLocker Connect', icon: Lock },
    { label: 'Fully Verified', icon: Award }
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <Shield className="w-10 h-10 mx-auto mb-2 text-blue-200" />
        <h1 className="text-2xl font-bold">Aadhaar & DigiLocker Verification</h1>
        <p className="text-blue-100 text-sm mt-1">Verify your identity through Aadhaar and fetch documents via DigiLocker</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-slate-200">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const active = (step === 0 && i === 0) || (step === 2 && i === 1) || (step === 3 && i === 2) || (step === 5 && i === 3);
          const done = (step >= 3 && i <= 1) || (step >= 5 && i <= 3);
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                  {done ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-medium ${done || active ? 'text-blue-700' : 'text-slate-400'}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${done ? 'bg-green-400' : 'bg-slate-200'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{success}</div>}

      {/* Step 0: Enter Aadhaar */}
      {step === 0 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><Fingerprint className="w-5 h-5 text-blue-600" /> Enter Aadhaar Details</h2>
          <p className="text-sm text-slate-500">Your Aadhaar number is verified through UIDAI's secure authentication system.</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Worker Name</label>
            <input type="text" value={workerName} onChange={e => setWorkerName(e.target.value)} placeholder="As per Aadhaar card" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Aadhaar Number (12 digits)</label>
            <input type="text" value={aadhaarNumber} onChange={e => setAadhaarNumber(e.target.value.replace(/\D/g,'').slice(0,12))} placeholder="XXXX XXXX XXXX" maxLength={12} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono tracking-widest" />
            <p className="text-[10px] text-slate-400 mt-1">Stored securely via UIDAI encryption. Never shared with third parties.</p>
          </div>
          <button onClick={handleInitiate} disabled={loading || aadhaarNumber.length !== 12} className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'Sending OTP...' : 'Send Aadhaar OTP'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: OTP Verification */}
      {step === 2 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><Smartphone className="w-5 h-5 text-blue-600" /> OTP Verification</h2>
          <p className="text-sm text-slate-500">A 6-digit OTP has been sent to your Aadhaar-linked mobile number.</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Enter OTP</label>
            <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6-digit OTP" maxLength={6} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-center text-lg tracking-[0.5em]" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50 flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
            <button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? 'Verifying...' : 'Verify OTP'} <CheckCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Aadhaar Verified, DigiLocker next */}
      {step === 3 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <h2 className="font-bold text-slate-800">Aadhaar Verified!</h2>
            <p className="text-sm text-slate-500">Your identity has been confirmed via UIDAI.</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 text-sm flex items-center gap-2"><Lock className="w-4 h-4" /> Connect DigiLocker</h3>
            <p className="text-xs text-blue-600 mt-1">Fetch your verified documents (PAN, Education Certificate, Skill Certificate) directly from DigiLocker for instant verification.</p>
          </div>
          <button onClick={handleDigiLocker} disabled={loading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'Connecting...' : 'Connect DigiLocker & Fetch Documents'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 5: Fully Verified */}
      {step === 5 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="text-center">
            <Award className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
            <h2 className="font-bold text-slate-800">Fully Verified — GOLD Level</h2>
            <p className="text-sm text-slate-500">Aadhaar + DigiLocker verification complete.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {status?.verifiedDocuments?.map((doc, i) => (
              <div key={i} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                <FileCheck className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800 font-medium">{doc}</span>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            Your GOLD verification badge will be displayed on your profile and skill passport. Customers can trust your verified identity.
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
        <h3 className="font-bold text-slate-700 text-sm">How Aadhaar + DigiLocker Verification Works</h3>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>Aadhaar OTP:</strong> UIDAI sends a one-time password to your registered mobile</li>
          <li><strong>DigiLocker:</strong> Government-backed document wallet — fetches PAN, education, and skill certificates</li>
          <li><strong>Verification Levels:</strong> NONE → SILVER (Aadhaar) → GOLD (Aadhaar + DigiLocker)</li>
          <li><strong>Privacy:</strong> Documents are verified, not stored. Only verification status is shared.</li>
        </ul>
      </div>
    </div>
  );
}

export default AadhaarVerificationPage;
