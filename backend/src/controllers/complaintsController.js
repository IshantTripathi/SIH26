import { store } from '../data/store.js';
import { COMPLAINT_STATUS } from '../config/constants.js';

export function getAllComplaints(req, res) {
  try {
    const { societyId, customerId, workerId, status } = req.query;
    let complaints = store.getCollection('complaints');

    if (societyId) complaints = complaints.filter(c => c.societyId === societyId);
    if (customerId) complaints = complaints.filter(c => c.customerId === customerId);
    if (workerId) complaints = complaints.filter(c => c.workerId === workerId);
    if (status) complaints = complaints.filter(c => c.status === status);

    return res.json({ success: true, count: complaints.length, complaints });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function createComplaint(req, res) {
  try {
    const { jobId, category, description, priority = 'Medium' } = req.body;
    const user = req.user;

    const job = store.findById('jobs', jobId);
    const code = `CMP-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newComplaint = store.create('complaints', {
      code,
      jobId: jobId || 'JOB-GENERAL',
      customerId: user.id,
      customerName: user.name,
      workerId: job?.workerId || null,
      workerName: job?.workerName || 'N/A',
      societyId: job?.societyId || 'SOC-DEMO-001',
      category: category || 'Service Quality',
      description: description || 'No details provided',
      priority,
      status: COMPLAINT_STATUS.CREATED,
      resolutionNotes: '',
      history: [
        { status: COMPLAINT_STATUS.CREATED, timestamp: new Date().toISOString(), updatedBy: user.name }
      ]
    });

    store.logAudit({
      actorName: user.name,
      actorRole: user.role,
      action: 'COMPLAINT_RAISED',
      module: 'Dispute Management',
      recordId: newComplaint.id,
      details: `Complaint #${code} raised under category: ${category}`
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted to the Cooperative Society Grievance Board.',
      complaint: newComplaint
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function updateComplaintStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;
    const user = req.user;

    const complaint = store.findById('complaints', id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint record not found.' });
    }

    const history = complaint.history || [];
    history.push({
      status,
      timestamp: new Date().toISOString(),
      updatedBy: user.name,
      notes: resolutionNotes || ''
    });

    const updated = store.findByIdAndUpdate('complaints', id, {
      status,
      resolutionNotes: resolutionNotes || complaint.resolutionNotes,
      ...(status === COMPLAINT_STATUS.CLOSED && { resolvedAt: new Date().toISOString() }),
      history
    });

    store.logAudit({
      actorName: user.name,
      actorRole: user.role,
      action: 'COMPLAINT_STATUS_UPDATED',
      module: 'Dispute Management',
      recordId: id,
      details: `Complaint #${complaint.code} transitioned to status: ${status}`
    });

    return res.json({
      success: true,
      message: `Complaint updated to ${status}`,
      complaint: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
