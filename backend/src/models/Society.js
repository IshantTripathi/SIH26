import mongoose from 'mongoose';

const societySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  federationId: { type: String, required: true },
  name: { type: String, required: true },
  registrationNumber: { type: String },
  district: { type: String, required: true },
  coverageRadiusKm: { type: Number, default: 15 },
  pincodesCovered: [{ type: String }],
  centerLocation: {
    lat: Number,
    lng: Number,
    area: String
  },
  coopContributionPercent: { type: Number, default: 4.0 },
  welfareFundPercent: { type: Number, default: 1.0 },
  workerPayoutPercent: { type: Number, default: 95.0 },
  officialEmail: { type: String },
  totalWorkers: { type: Number, default: 0 },
  activeJobsCount: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

export const Society = mongoose.model('Society', societySchema);
