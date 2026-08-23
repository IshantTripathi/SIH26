import { store } from '../data/store.js';

export function createMeeting(req, res) {
  try {
    const { title, description, scheduledDate, scheduledTime, location, agenda = [], societyId } = req.body;
    const meeting = store.create('meetings', {
      title,
      description: description || '',
      scheduledDate,
      scheduledTime,
      location: location || 'Online / Society Office',
      agenda,
      societyId: societyId || req.user?.societyId || 'SOC-DEMO-001',
      organizer: req.user?.name || 'Society Admin',
      status: 'Scheduled',
      attendees: [],
      minutes: '',
      resolutions: [],
      quorumRequired: 0.5,
      totalEligible: store.find('workers', { societyId: societyId || 'SOC-DEMO-001' }).length || 10
    });

    store.logAudit({
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'MEETING_SCHEDULED',
      module: 'Governance',
      recordId: meeting.id,
      details: `Meeting "${title}" scheduled for ${scheduledDate} ${scheduledTime}`
    });

    return res.status(201).json({ success: true, meeting });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getMeetings(req, res) {
  try {
    const societyId = req.user?.societyId || req.query.societyId || 'SOC-DEMO-001';
    const meetings = store.find('meetings', { societyId });
    return res.json({ success: true, count: meetings.length, meetings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function recordAttendance(req, res) {
  try {
    const { id } = req.params;
    const { workerId, present } = req.body;
    const meeting = store.findById('meetings', id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found.' });

    const attendance = meeting.attendees || [];
    const existing = attendance.findIndex(a => a.workerId === workerId);
    if (existing >= 0) {
      attendance[existing].present = present;
      attendance[existing].timestamp = new Date().toISOString();
    } else {
      attendance.push({ workerId, present, timestamp: new Date().toISOString() });
    }

    store.findByIdAndUpdate('meetings', id, { attendees: attendance });

    const presentCount = attendance.filter(a => a.present).length;
    const quorumMet = presentCount >= meeting.totalEligible * meeting.quorumRequired;

    return res.json({ success: true, attendance, presentCount, quorumRequired: meeting.totalEligible * meeting.quorumRequired, quorumMet });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function updateMeetingMinutes(req, res) {
  try {
    const { id } = req.params;
    const { minutes, resolutions = [] } = req.body;
    const updated = store.findByIdAndUpdate('meetings', id, {
      minutes,
      resolutions,
      status: 'Completed',
      completedAt: new Date().toISOString()
    });
    store.logAudit({
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'MEETING_MINUTES_RECORDED',
      module: 'Governance',
      recordId: id,
      details: `Meeting minutes recorded with ${resolutions.length} resolutions`
    });
    return res.json({ success: true, meeting: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getBylaws(req, res) {
  try {
    const societyId = req.user?.societyId || req.query.societyId || 'SOC-DEMO-001';
    const bylaws = store.find('bylaws', { societyId });
    if (bylaws.length === 0) {
      const defaults = [
        { id: 'BYLAW-001', title: 'Democratic Decision Making', description: 'All major decisions require member vote with simple majority', category: 'Governance', societyId, version: '1.0', status: 'Active', effectiveDate: '2025-01-01' },
        { id: 'BYLAW-002', title: 'Fair Wage Distribution', description: 'Workers receive minimum 95% of service gross amount', category: 'Compensation', societyId, version: '1.0', status: 'Active', effectiveDate: '2025-01-01' },
        { id: 'BYLAW-003', title: 'Skill Verification Requirement', description: 'All workers must complete cooperative skill assessment before onboarding', category: 'Membership', societyId, version: '1.0', status: 'Active', effectiveDate: '2025-01-01' },
        { id: 'BYLAW-004', title: 'Workload Protection', description: 'No worker shall be assigned more than 6 concurrent active jobs', category: 'Worker Welfare', societyId, version: '1.0', status: 'Active', effectiveDate: '2025-01-01' },
        { id: 'BYLAW-005', title: 'Dispute Resolution Process', description: 'All disputes go through society review → investigation → resolution within 7 days', category: 'Dispute Resolution', societyId, version: '1.0', status: 'Active', effectiveDate: '2025-01-01' }
      ];
      defaults.forEach(b => store.create('bylaws', b));
      return res.json({ success: true, count: defaults.length, bylaws: defaults });
    }
    return res.json({ success: true, count: bylaws.length, bylaws });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function createBylaw(req, res) {
  try {
    const { title, description, category, societyId } = req.body;
    const bylaw = store.create('bylaws', {
      title,
      description,
      category: category || 'General',
      societyId: societyId || req.user?.societyId || 'SOC-DEMO-001',
      version: '1.0',
      status: 'Draft',
      effectiveDate: new Date().toISOString().split('T')[0],
      proposedBy: req.user?.name || 'Unknown'
    });
    store.logAudit({
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'BYLAW_PROPOSED',
      module: 'Governance',
      recordId: bylaw.id,
      details: `Bylaw "${title}" proposed in ${category} category`
    });
    return res.status(201).json({ success: true, bylaw });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function createResolution(req, res) {
  try {
    const { title, description, meetingId, proposedBy, societyId } = req.body;
    const resolution = store.create('resolutions', {
      title,
      description,
      meetingId: meetingId || null,
      proposedBy: proposedBy || req.user?.name,
      societyId: societyId || req.user?.societyId || 'SOC-DEMO-001',
      status: 'Proposed',
      votesFor: 0,
      votesAgainst: 0,
      totalEligible: store.find('workers', { societyId: societyId || 'SOC-DEMO-001' }).length || 10,
      implementationStatus: 'Pending',
      createdAt: new Date().toISOString()
    });
    return res.status(201).json({ success: true, resolution });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getResolutions(req, res) {
  try {
    const societyId = req.user?.societyId || req.query.societyId || 'SOC-DEMO-001';
    const resolutions = store.find('resolutions', { societyId });
    return res.json({ success: true, count: resolutions.length, resolutions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function voteResolution(req, res) {
  try {
    const { id } = req.params;
    const { vote } = req.body;
    const resolution = store.findById('resolutions', id);
    if (!resolution) return res.status(404).json({ success: false, message: 'Resolution not found.' });

    const updates = {};
    if (vote === 'for') updates.votesFor = (resolution.votesFor || 0) + 1;
    else if (vote === 'against') updates.votesAgainst = (resolution.votesAgainst || 0) + 1;

    const newFor = updates.votesFor || resolution.votesFor;
    if (newFor > resolution.totalEligible / 2) {
      updates.status = 'Approved';
      updates.implementationStatus = 'Pending Implementation';
    }

    const updated = store.findByIdAndUpdate('resolutions', id, updates);
    return res.json({ success: true, resolution: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getParticipationLog(req, res) {
  try {
    const societyId = req.user?.societyId || req.query.societyId || 'SOC-DEMO-001';
    const meetings = store.find('meetings', { societyId });
    const resolutions = store.find('resolutions', { societyId });
    const proposals = store.find('proposals', {});

    const participation = {};
    meetings.forEach(m => {
      (m.attendees || []).forEach(a => {
        if (!participation[a.workerId]) participation[a.workerId] = { meetingsAttended: 0, meetingsTotal: 0, votesCast: 0 };
        participation[a.workerId].meetingsTotal++;
        if (a.present) participation[a.workerId].meetingsAttended++;
      });
    });

    return res.json({
      success: true,
      summary: {
        totalMeetings: meetings.length,
        totalResolutions: resolutions.length,
        totalProposals: proposals.length,
        activeResolutions: resolutions.filter(r => r.status === 'Proposed').length,
        approvedResolutions: resolutions.filter(r => r.status === 'Approved').length
      },
      participation: Object.entries(participation).map(([workerId, data]) => ({
        workerId,
        ...data,
        participationRate: data.meetingsTotal > 0 ? Math.round((data.meetingsAttended / data.meetingsTotal) * 100) : 0
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
