import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  jobId: { type: String },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  workerId: { type: String },
  workerName: { type: String },
  societyId: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, default: 'Normal' },
  status: { type: String, enum: ['Open', 'Under Review', 'Resolved', 'Closed'], default: 'Open' },
  resolutionNotes: { type: String },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
});

export const Complaint = mongoose.model('Complaint', complaintSchema);
