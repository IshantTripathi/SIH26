import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  code: { type: String, required: true },
  name: { type: String, required: true },
  societyId: { type: String, required: true },
  serviceCategories: [{ type: String }],
  primarySkill: { type: String, required: true },
  secondarySkills: [{ type: String }],
  experienceYears: { type: Number, default: 1 },
  certifications: [
    {
      code: String,
      title: String,
      issuedBy: String,
      issuedDate: String,
      verified: Boolean
    }
  ],
  verificationStatus: {
    type: String,
    enum: ['Pending', 'Under Review', 'Verified', 'Suspended'],
    default: 'Pending'
  },
  isOnline: { type: Boolean, default: true },
  currentWorkload: {
    type: String,
    enum: ['Underutilized', 'Balanced', 'High Workload'],
    default: 'Balanced'
  },
  activeJobsCount: { type: Number, default: 0 },
  recentCompletedJobs: { type: Number, default: 0 },
  ratingAvg: { type: Number, default: 5.0 },
  ratingCount: { type: Number, default: 0 },
  totalEarningsGross: { type: Number, default: 0 },
  location: {
    lat: Number,
    lng: Number,
    area: String
  },
  welfareId: { type: String },
  insuranceId: { type: String },
  serviceAreas: [{ type: String }],
  reliabilityScore: { type: Number, default: 90 }
});

export const Worker = mongoose.model('Worker', workerSchema);
