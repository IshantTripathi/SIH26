import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Clock,
  TrendingUp,
  MapPin,
  FileText,
  UserCheck,
  X,
  Play,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function DemoScenarioModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('scenario1'); // scenario1 | scenario2 | scenario3
  const [loading, setLoading] = useState(false);
  const [scenario2Data, setScenario2Data] = useState(null);
  const [scenario3Data, setScenario3Data] = useState(null);
  const [scenario1Step, setScenario1Step] = useState(1);
  const [scenario1Job, setScenario1Job] = useState(null);
  const { quickSwitchRole } = useAuth();

  // Load Scenario 2 & 3 data when opened
  useEffect(() => {
    if (isOpen) {
      loadScenario2();
      loadScenario3();
    }
  }, [isOpen]);

  const loadScenario2 = async () => {
    try {
      const res = await api.getFivePlumberScenario();
      if (res.success) setScenario2Data(res.result);
    } catch (err) {
      console.error(err);
    }
  };

  const loadScenario3 = async () => {
    try {
      const res = await api.getDemandAnalytics({ district: 'North District' });
      if (res.success) setScenario3Data(res.forecast);
    } catch (err) {
      console.error(err);
    }
  };

  // Scenario 1 Interactive Step-by-step runner
  const handleScenario1NextStep = async () => {
    setLoading(true);
    try {
      if (scenario1Step === 1) {
        // Step 1: Customer submits "I have a leaking kitchen tap"
        await quickSwitchRole('customer01@demo.coop');
        const res = await api.createJobRequest({
          problemDescription: 'I have a leaking kitchen tap under the sink causing water accumulation.',
          urgency: 'Normal',
          customerAddress: 'B-42, Metro Residency, Connaught Place'
        });
        if (res.success) {
          setScenario1Job(res.job);
          setScenario1Step(2);
        }
      } else if (scenario1Step === 2) {
        // Step 2: Worker B accepts job
        await quickSwitchRole('worker01@demo.coop');
        const res = await api.updateJobStatus(scenario1Job.id, { status: 'ACCEPTED' });
        if (res.success) {
          setScenario1Job(res.job);
          setScenario1Step(3);
        }
      } else if (scenario1Step === 3) {
        // Step 3: Worker moves to ON_THE_WAY -> ARRIVED -> IN_PROGRESS
        await api.updateJobStatus(scenario1Job.id, { status: 'ON_THE_WAY' });
        await api.updateJobStatus(scenario1Job.id, { status: 'ARRIVED' });
        const res = await api.updateJobStatus(scenario1Job.id, { status: 'IN_PROGRESS' });
        if (res.success) {
          setScenario1Job(res.job);
          setScenario1Step(4);
        }
      } else if (scenario1Step === 4) {
        // Step 4: Worker marks COMPLETED with OTP
        const res = await api.updateJobStatus(scenario1Job.id, {
          status: 'COMPLETED',
          otpInput: scenario1Job.otp || '1234'
        });
        if (res.success) {
          setScenario1Job(res.job);
          setScenario1Step(5);
        }
      } else if (scenario1Step === 5) {
        // Step 5: Customer pays via UPI
        await quickSwitchRole('customer01@demo.coop');
        const res = await api.processPayment(scenario1Job.id, { paymentMethod: 'UPI' });
        if (res.success) {
          setScenario1Job(res.job);
          setScenario1Step(6);
        }
      } else if (scenario1Step === 6) {
        // Step 6: Customer rates 5 stars
        const res = await api.submitRating(scenario1Job.id, {
          score: 5,
          punctuality: 5,
          quality: 5,
          professionalism: 5,
          comment: 'Outstanding plumbing work by certified cooperative plumber.'
        });
        if (res.success) {
          setScenario1Job(res.job);
          setScenario1Step(7);
          try {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
          } catch (e) {}
        }
      }
    } catch (err) {
      alert(`Error in demo step: ${err.message}`);
    }
    setLoading(false);
  };

  const handleResetScenario1 = () => {
    setScenario1Step(1);
    setScenario1Job(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#0f2e5a] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold leading-tight">SIH Hackathon Demo Walkthrough Scenarios</h2>
              <p className="text-xs text-slate-300 font-medium">
                Official demonstration workflows for SIH26089 (Ministry of Cooperation / NCCT)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenario Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 flex space-x-2">
          <button
            onClick={() => setActiveTab('scenario1')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'scenario1'
                ? 'border-blue-900 text-blue-900 bg-white shadow-sm rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Scenario 1: End-to-End Service Flow
          </button>
          <button
            onClick={() => setActiveTab('scenario2')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'scenario2'
                ? 'border-blue-900 text-blue-900 bg-white shadow-sm rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Scenario 2: Fair Work Allocation (5 Plumbers)
          </button>
          <button
            onClick={() => setActiveTab('scenario3')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'scenario3'
                ? 'border-blue-900 text-blue-900 bg-white shadow-sm rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Scenario 3: Demand Forecasting & Reallocation
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800 text-sm">
          {/* SCENARIO 1: End-to-End Service Flow */}
          {activeTab === 'scenario1' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-start gap-2">
                <div className="font-bold uppercase text-[10px] bg-blue-900 text-white px-2 py-0.5 rounded mt-0.5">
                  Concept
                </div>
                <div>
                  Demonstrates the full cooperative lifecycle from customer problem intent classification, fair worker selection, multi-stage job progression with OTP, transparent earnings deduction, invoice issuance, and live cooperative ledger updates.
                </div>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { step: 1, title: 'Problem Request', desc: 'Leaking kitchen tap' },
                  { step: 2, title: 'Fair Allocation', desc: 'Matched Worker B' },
                  { step: 4, title: 'Job Progress', desc: 'Arrived & OTP Complete' },
                  { step: 6, title: 'Payment & Invoice', desc: 'UPI & Transparent Deductions' }
                ].map((s) => (
                  <div
                    key={s.step}
                    className={`p-2.5 rounded-lg border text-xs ${
                      scenario1Step > s.step
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                        : scenario1Step === s.step
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-2 ring-blue-900/10'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Stage {s.step}</span>
                      {scenario1Step > s.step && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="font-semibold text-slate-800 mt-0.5">{s.title}</div>
                    <div className="text-[10px] text-slate-500">{s.desc}</div>
                  </div>
                ))}
              </div>

              {/* Interactive Console */}
              <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs space-y-2 border border-slate-800">
                <div className="text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                  Live System Execution Log:
                </div>
                {scenario1Step === 1 && (
                  <p className="text-slate-300">
                    &gt; Ready. Click "Submit Request" to send problem statement: "I have a leaking kitchen tap".
                  </p>
                )}
                {scenario1Step >= 2 && scenario1Job && (
                  <div>
                    <p className="text-emerald-400">
                      ✓ Service Identified: {scenario1Job.serviceCategory} ({scenario1Job.serviceTitle})
                    </p>
                    <p className="text-blue-300">
                      ✓ Fair Allocation Engine evaluated candidates. Assigned: {scenario1Job.workerName}
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      &gt; Reason: {scenario1Job.allocationReason}
                    </p>
                  </div>
                )}
                {scenario1Step >= 4 && scenario1Job && (
                  <p className="text-emerald-400">
                    ✓ Job Status: {scenario1Job.status} | Customer Completion OTP: {scenario1Job.otp}
                  </p>
                )}
                {scenario1Step >= 6 && scenario1Job && (
                  <div>
                    <p className="text-emerald-400">✓ Payment Settled via UPI: ₹{scenario1Job.pricing?.grossAmount}</p>
                    <p className="text-amber-300 text-[11px]">
                      └ Cooperative Admin Contribution (4%): ₹{scenario1Job.pricing?.coopContribution}
                      <br />
                      └ Labour Welfare & Insurance Fund (1%): ₹{scenario1Job.pricing?.welfareDeduction}
                      <br />
                      └ Net Worker Pay (95%): ₹{scenario1Job.pricing?.netWorkerEarnings}
                    </p>
                  </div>
                )}
                {scenario1Step === 7 && (
                  <p className="text-emerald-300 font-bold">
                    ★ Cycle Completed! Customer gave 5-star rating. Worker earnings and Society dashboard updated!
                  </p>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleResetScenario1}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restart Scenario
                </button>

                {scenario1Step < 7 ? (
                  <button
                    onClick={handleScenario1NextStep}
                    disabled={loading}
                    className="bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white px-5 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      'Executing...'
                    ) : scenario1Step === 1 ? (
                      <>
                        <span>Step 1: Submit Customer Problem Request</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : scenario1Step === 2 ? (
                      <>
                        <span>Step 2: Worker B Accepts Job Offer</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : scenario1Step === 3 ? (
                      <>
                        <span>Step 3: Worker On The Way & In Progress</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : scenario1Step === 4 ? (
                      <>
                        <span>Step 4: Complete Job with OTP Verification</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : scenario1Step === 5 ? (
                      <>
                        <span>Step 5: Customer Settles UPI Payment</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>Step 6: Customer Rates 5 Stars & Complete</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Scenario 1 Successfully Completed!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* SCENARIO 2: Fair Work Allocation Benchmark (5 Plumbers) */}
          {activeTab === 'scenario2' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                <div className="font-bold text-sm mb-1">
                  Why Cooperative Allocation Beats Pure Distance Algorithms
                </div>
                <div>
                  Conventional platforms blindly assign the nearest worker, leading to worker exhaustion and extreme income inequality. The cooperative engine balances skill, certification, online duty, distance, current workload, and worker fairness.
                </div>
              </div>

              {/* 5 Plumbers Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Candidate</th>
                      <th className="p-2.5">Distance</th>
                      <th className="p-2.5">Active Workload</th>
                      <th className="p-2.5">Online Status</th>
                      <th className="p-2.5">Workload Balance Score</th>
                      <th className="p-2.5">Total Match Score</th>
                      <th className="p-2.5">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Worker B (Winner) */}
                    <tr className="bg-emerald-50/80 font-medium">
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">Worker Demo 01 (Worker B)</div>
                        <div className="text-[10px] text-emerald-800 font-semibold">NCCT Level-2 Certified</div>
                      </td>
                      <td className="p-2.5">1.4 km</td>
                      <td className="p-2.5">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          2 Jobs (Balanced)
                        </span>
                      </td>
                      <td className="p-2.5 text-emerald-700 font-bold">Online</td>
                      <td className="p-2.5 font-mono text-emerald-800 font-bold">14 / 15 pts</td>
                      <td className="p-2.5 font-mono text-emerald-900 font-extrabold text-sm">
                        {scenario2Data?.recommendedWorker?.totalScore || 91.8} / 100
                      </td>
                      <td className="p-2.5">
                        <span className="bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase">
                          ★ RECOMMENDED
                        </span>
                      </td>
                    </tr>

                    {/* Worker A (Nearest but Overloaded) */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">Worker Demo 02 (Worker A)</div>
                        <div className="text-[10px] text-slate-500">Master Plumber</div>
                      </td>
                      <td className="p-2.5 font-semibold text-slate-800">1.0 km (Nearest)</td>
                      <td className="p-2.5">
                        <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">
                          8 Jobs (High Workload)
                        </span>
                      </td>
                      <td className="p-2.5 text-emerald-700 font-bold">Online</td>
                      <td className="p-2.5 font-mono text-red-600 font-bold">0 / 15 pts (Penalized)</td>
                      <td className="p-2.5 font-mono text-slate-700">77.0 / 100</td>
                      <td className="p-2.5 text-slate-500 text-[11px]">Deprioritized (Overloaded)</td>
                    </tr>

                    {/* Worker C (Nearest but Offline) */}
                    <tr className="hover:bg-slate-50 text-slate-400">
                      <td className="p-2.5">
                        <div className="font-semibold">Worker Demo 03 (Worker C)</div>
                        <div className="text-[10px]">Trade Badge</div>
                      </td>
                      <td className="p-2.5">0.8 km (Closest)</td>
                      <td className="p-2.5">5 Jobs</td>
                      <td className="p-2.5 text-red-600 font-bold">Offline (Unavailable)</td>
                      <td className="p-2.5 font-mono">0 pts</td>
                      <td className="p-2.5 font-mono">0.0 / 100</td>
                      <td className="p-2.5 text-red-700 text-[11px]">Excluded (Unavailable)</td>
                    </tr>

                    {/* Worker D */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5">
                        <div className="font-semibold">Worker Demo 04 (Worker D)</div>
                        <div className="text-[10px] text-slate-500">Vocational Cert</div>
                      </td>
                      <td className="p-2.5">2.5 km</td>
                      <td className="p-2.5">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          0 Jobs (Underutilized)
                        </span>
                      </td>
                      <td className="p-2.5 text-emerald-700 font-bold">Online</td>
                      <td className="p-2.5 font-mono text-emerald-700">15 / 15 pts</td>
                      <td className="p-2.5 font-mono text-slate-700">86.0 / 100</td>
                      <td className="p-2.5 text-slate-500 text-[11px]">Rank #2 (Viable)</td>
                    </tr>

                    {/* Worker E */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5">
                        <div className="font-semibold">Worker Demo 05 (Worker E)</div>
                        <div className="text-[10px] text-slate-500">Advanced License</div>
                      </td>
                      <td className="p-2.5">1.9 km</td>
                      <td className="p-2.5">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          3 Jobs (Balanced)
                        </span>
                      </td>
                      <td className="p-2.5 text-emerald-700 font-bold">Online</td>
                      <td className="p-2.5 font-mono text-emerald-700">10 / 15 pts</td>
                      <td className="p-2.5 font-mono text-slate-700">83.0 / 100</td>
                      <td className="p-2.5 text-slate-500 text-[11px]">Rank #3</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Rationale Callout */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div className="font-bold text-slate-800 mb-1">Mathematical Breakdown Rationale:</div>
                <p className="text-slate-600">
                  Worker B scored <strong>91.8 points</strong> because they have verified skill qualifications, are online on-duty, within the 2km standard service radius (1.4 km), and hold a healthy workload of 2 active jobs. Worker A (1.0 km) was penalized for having 8 active jobs, protecting them from worker fatigue and distributing livelihood opportunities fairly.
                </p>
              </div>
            </div>
          )}

          {/* SCENARIO 3: Demand Forecasting & Workforce Reallocation */}
          {activeTab === 'scenario3' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Predictive Demand Forecasting & Shortage Detection
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculated for Labour Cooperative Societies across regional districts
                  </p>
                </div>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2.5 py-1 rounded">
                  Model Estimate — Demo
                </span>
              </div>

              {/* Regional Demand Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Region A */}
                <div className="p-4 border-2 border-red-200 bg-red-50/50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">North District (Region A)</span>
                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      High Demand Alert
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Primary Trade Surge: <strong>Plumbing (Drainage & Water Supply)</strong>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center py-2 bg-white rounded-lg border border-red-100">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Expected Demand</div>
                      <div className="text-lg font-bold text-slate-900">24 Jobs</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Available Workers</div>
                      <div className="text-lg font-bold text-blue-900">15</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-red-500 font-semibold uppercase">Shortage</div>
                      <div className="text-lg font-bold text-red-600">9 Workers</div>
                    </div>
                  </div>
                  <div className="text-xs bg-red-100/70 text-red-900 p-2 rounded border border-red-200">
                    <strong>Cooperative Recommendation:</strong> Mobilize 4-6 certified plumbers from East District / reserve roster to North District for tomorrow's morning shift.
                  </div>
                </div>

                {/* Region B */}
                <div className="p-4 border border-emerald-200 bg-emerald-50/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">Central Metro</span>
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      Balanced
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Primary Trade: <strong>Electrical Maintenance</strong>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center py-2 bg-white rounded-lg border border-emerald-100">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Expected Demand</div>
                      <div className="text-lg font-bold text-slate-900">14 Jobs</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Available Workers</div>
                      <div className="text-lg font-bold text-blue-900">14</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-600 font-semibold uppercase">Shortage</div>
                      <div className="text-lg font-bold text-emerald-700">0</div>
                    </div>
                  </div>
                  <div className="text-xs bg-emerald-100/70 text-emerald-900 p-2 rounded border border-emerald-200">
                    <strong>Cooperative Recommendation:</strong> Workforce adequately balanced with demand forecast. No inter-society transfers required.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <div>
            Logged in Persona: <span className="font-bold text-slate-800">{useAuth().user?.name || 'Guest'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
