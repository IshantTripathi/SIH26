import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  actorName: { type: String, default: 'System' },
  actorRole: { type: String, default: 'system' },
  action: { type: String, required: true },
  module: { type: String, default: 'General' },
  recordId: { type: String, default: 'N/A' },
  details: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
