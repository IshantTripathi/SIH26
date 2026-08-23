import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Shield, Star, Award, QrCode, ExternalLink, CheckCircle, Clock, User } from 'lucide-react';

export function SkillPassportPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    loadPassport();
  }, []);

  const loadPassport = async () => {
    setLoading(true);
    try {
      const workerId = user?.workerId || 'WRK-001';
      const res = await api.getWorkerPassport(workerId);
      if (res.success) setPassport(res.passport);
    } catch (err) { /* silent */ }
    setLoading(false);
  };

  const verify = async () => {
    if (!passport) return;
    try {
      const res = await api.verifyPassport(passport.workerId, passport.verificationHash);
      if (res.success) setVerifyResult(res);
    } catch (err) { /* silent */ }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Digital Skill Passport</h1>
        <p className="text-sm text-slate-500 mt-1">Portable, verifiable cooperative worker credential</p>
      </div>

      {passport && (
        <>
          {/* Passport Card */}
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-amber-400" />
                <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Sahakar Skill Passport</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                passport.tier === 'Platinum' ? 'bg-purple-500' :
                passport.tier === 'Gold' ? 'bg-amber-500' :
                passport.tier === 'Silver' ? 'bg-slate-400' : 'bg-blue-600'
              }`}>{passport.tier}</span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-700 flex items-center justify-center border-2 border-amber-400">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{passport.name}</h2>
                <p className="text-blue-200 text-sm">{passport.trade} • {passport.experienceYears}yr exp</p>
                <p className="text-blue-300 text-xs">{passport.society}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-800/50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold">{passport.trustScore}</div>
                <div className="text-[10px] text-blue-200">Trust Score</div>
              </div>
              <div className="bg-blue-800/50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold">{passport.totalJobsCompleted}</div>
                <div className="text-[10px] text-blue-200">Jobs Done</div>
              </div>
              <div className="bg-blue-800/50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold">{passport.averageRating}★</div>
                <div className="text-[10px] text-blue-200">Avg Rating</div>
              </div>
            </div>

            <div className="border-t border-blue-700 pt-3">
              <div className="flex items-center gap-2 text-xs text-blue-200">
                <QrCode className="w-4 h-4" />
                <span className="font-mono">{passport.qrPayload?.slice(0, 50)}...</span>
              </div>
              <p className="text-[10px] text-blue-300 mt-1">Hash: {passport.verificationHash?.slice(0, 16)}...</p>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" /> Certified Skills
            </h3>
            <div className="space-y-2">
              {passport.skills.map((skill, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{skill.name}</div>
                    <div className="text-[10px] text-slate-500">Certified by: {skill.certifiedBy}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    skill.certified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {skill.certified ? '✓ Certified' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Endorsements */}
          {passport.endorsements.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Endorsements
              </h3>
              <div className="space-y-2">
                {passport.endorsements.map((e, i) => (
                  <div key={i} className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-800">{e.from}</span>
                      <span className="text-xs text-amber-600">{'★'.repeat(e.rating)}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">{e.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={verify}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> Verify This Passport
          </button>

          {verifyResult && (
            <div className={`p-3 rounded-xl text-sm ${verifyResult.valid ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
              {verifyResult.valid ? '✓ Passport VERIFIED — Authentic Sahakar Credential' : '✗ Verification Failed'}
            </div>
          )}

          {/* Work History */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" /> Recent Work History
            </h3>
            <div className="space-y-1">
              {passport.workHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded">
                  <span className="font-medium text-slate-700">{h.jobCode} — {h.service}</span>
                  <span className="text-slate-500">{h.rating ? `${h.rating}★` : 'No rating'}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default SkillPassportPage;
