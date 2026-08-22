import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerType: { type: String, enum: ['Household', 'Institution'], default: 'Household' },
  institutionName: { type: String },
  institutionType: { type: String },
  contactPerson: { type: String },
  customerPhone: { type: String },
  customerAddress: { type: String },
  workerId: { type: String },
  workerName: { type: String },
  workerPhone: { type: String },
  societyId: { type: String, required: true },
  serviceId: { type: String },
  serviceCategory: { type: String, required: true },
  serviceTitle: { type: String },
  problemDescription: { type: String },
  urgency: { type: String, default: 'Normal' },
  status: {
    type: String,
    enum: ['REQUESTED', 'MATCHING', 'OFFERED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'PAYMENT_PENDING', 'PAID', 'CANCELLED'],
    default: 'REQUESTED'
  },
  pricing: {
    grossAmount: Number,
    coopContribution: Number,
    welfareDeduction: Number,
    netWorkerEarnings: Number,
    coopPercent: Number,
    welfarePercent: Number,
    disclaimer: String
  },
  paymentStatus: { type: String, default: 'PAYMENT_PENDING' },
  paymentMethod: { type: String },
  invoiceNumber: { type: String },
  otp: { type: String },
  allocationReason: { type: String },
  scheduledDate: { type: String },
  scheduledTime: { type: String },
  rating: {
    score: Number,
    punctuality: Number,
    quality: Number,
    professionalism: Number,
    comment: String,
    createdAt: Date
  },
  statusHistory: [
    {
      status: String,
      timestamp: Date
    }
  ],
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

export const Job = mongoose.model('Job', jobSchema);
