import mongoose from 'mongoose';

const welfareRecordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  workerId: { type: String, required: true },
  workerName: { type: String, required: true },
  societyId: { type: String, required: true },
  welfareSchemeName: { type: String, default: 'Cooperative Worker Welfare Program' },
  insurancePolicyNumber: { type: String },
  insuranceStatus: { type: String, default: 'Active' },
  coverageAmount: { type: Number, default: 200000 },
  accidentalCoverage: { type: Number, default: 300000 },
  benefits: [{ type: String }],
  totalContributionsContributed: { type: Number, default: 0 },
  claimsProcessedCount: { type: Number, default: 0 },
  lastClaimDate: { type: String },
  lastClaimAmount: { type: Number },
  claimPurpose: { type: String },
  eligibilityStatus: { type: String, default: 'Eligible & Enrolled' },
  status: { type: String, default: 'Active (Demo Record)' },
  createdAt: { type: Date, default: Date.now }
});

export const WelfareRecord = mongoose.model('WelfareRecord', welfareRecordSchema);
