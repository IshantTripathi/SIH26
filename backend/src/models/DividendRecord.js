import mongoose from 'mongoose';

const dividendRecordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  memberId: { type: String, required: true },
  workerName: { type: String, required: true },
  societyId: { type: String, required: true },
  financialPeriod: { type: String, required: true },
  surplusBasis: { type: Number, required: true },
  calculatedAmount: { type: Number, required: true },
  eligibility: { type: String, default: 'Eligible' },
  approvalStatus: { type: String, enum: ['Projected', 'Pending Approval', 'Approved', 'Rejected'], default: 'Projected' },
  payoutStatus: { type: String, enum: ['Projected', 'Pending Payout', 'Paid'], default: 'Projected' },
  disclaimer: { type: String, default: 'Illustrative cooperative allocation model — values are configurable and not presented as statutory rates.' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const DividendRecord = mongoose.model('DividendRecord', dividendRecordSchema);
