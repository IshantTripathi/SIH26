import mongoose from 'mongoose';

const federationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  state: { type: String, required: true },
  districtsCovered: [{ type: String }],
  contactEmail: { type: String },
  establishedYear: { type: Number },
  activeSocietiesCount: { type: Number, default: 0 },
  totalWorkersCovered: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

export const Federation = mongoose.model('Federation', federationSchema);
