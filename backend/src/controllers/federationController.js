import { store } from '../data/store.js';
import { ROLES } from '../config/constants.js';

export function getFederationDashboard(req, res) {
  try {
    const federationId = req.params.id || req.user?.federationId || 'FED-DEMO-001';

    if (req.user?.role === ROLES.FEDERATION_ADMIN && req.user.federationId && federationId !== req.user.federationId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only access your assigned federation.' });
    }

    const federation = store.findById('federations', federationId);

    if (!federation) {
      return res.status(404).json({ success: false, message: 'Federation not found.' });
    }

    const societies = store.find('societies', { federationId });
    const allWorkers = store.getCollection('workers');
    const allJobs = store.getCollection('jobs');
    const allComplaints = store.getCollection('complaints');
    const demandData = store.getCollection('demandData');

    // Cross-society aggregation
    const totalSocieties = societies.length;
    const totalWorkers = allWorkers.length;
    const onlineWorkers = allWorkers.filter(w => w.isOnline).length;
    const verifiedWorkers = allWorkers.filter(w => w.verificationStatus === 'Verified').length;

    const completedJobs = allJobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');
    const totalGrossEarnings = completedJobs.reduce((sum, j) => sum + (j.pricing?.grossAmount || 0), 0);
    const totalWelfareFundAccumulated = completedJobs.reduce((sum, j) => sum + (j.pricing?.welfareDeduction || 0), 0);

    const avgRating = allWorkers.reduce((sum, w) => sum + (w.ratingAvg || 4.5), 0) / (allWorkers.length || 1);

    // Society comparison table
    const societySummaries = societies.map(soc => {
      const socWorkers = allWorkers.filter(w => w.societyId === soc.id);
      const socJobs = allJobs.filter(j => j.societyId === soc.id);
      const socCompleted = socJobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');
      const socEarnings = socCompleted.reduce((sum, j) => sum + (j.pricing?.grossAmount || 0), 0);

      return {
        id: soc.id,
        name: soc.name,
        district: soc.district,
        workersCount: socWorkers.length,
        onlineCount: socWorkers.filter(w => w.isOnline).length,
        jobsCount: socJobs.length,
        completedCount: socCompleted.length,
        grossEarnings: socEarnings,
        underutilizedCount: socWorkers.filter(w => (w.activeJobsCount || 0) === 0).length,
        overloadedCount: socWorkers.filter(w => (w.activeJobsCount || 0) > 4).length
      };
    });

    // Trade-wise distribution
    const tradeDistribution = {};
    allWorkers.forEach(w => {
      const skill = w.primarySkill || 'Other';
      tradeDistribution[skill] = (tradeDistribution[skill] || 0) + 1;
    });

    return res.json({
      success: true,
      federation,
      macroMetrics: {
        totalSocieties,
        totalWorkers,
        onlineWorkers,
        verifiedWorkers,
        totalJobs: allJobs.length,
        completedJobs: completedJobs.length,
        totalGrossEarnings,
        totalWelfareFundAccumulated,
        averageWorkerRating: Math.round(avgRating * 100) / 100,
        underutilizedTotal: allWorkers.filter(w => (w.activeJobsCount || 0) === 0).length,
        highWorkloadTotal: allWorkers.filter(w => (w.activeJobsCount || 0) > 4).length
      },
      societySummaries,
      tradeDistribution,
      demandHighlights: demandData
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function mobilizeWorkforce(req, res) {
  try {
    const { fromDistrict, toDistrict, serviceCategory = 'Plumbing', count = 4 } = req.body;
    if (!fromDistrict || !toDistrict) {
      return res.status(400).json({ success: false, message: 'fromDistrict and toDistrict are required.' });
    }
    const num = Math.min(10, Math.max(1, Number(count) || 4));
    // Simulate mobilization by logging audit and adjusting demandData shortage
    const demandList = store.getCollection('demandData');
    const target = demandList.find(d => d.district === toDistrict && d.serviceCategory === serviceCategory);
    if (target) {
      target.activeWorkersAvailable = (target.activeWorkersAvailable || 0) + num;
      target.potentialShortage = Math.max(0, (target.predictedDemand || 0) - target.activeWorkersAvailable);
      if (target.potentialShortage === 0) target.recommendation = 'Workforce deficit resolved after mobilization. Monitor for next shift.';
      else target.recommendation = `Partial mobilization: moved ${num} workers; remaining shortage ${target.potentialShortage}.`;
    }
    store.logAudit({
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'WORKFORCE_MOBILIZED',
      module: 'Federation Governance',
      recordId: `${fromDistrict}->${toDistrict}`,
      details: `Mobilized ${num} certified ${serviceCategory} workers from ${fromDistrict} to ${toDistrict} for demand surge.`
    });
    store.pushNotification({
      title: 'Workforce Mobilization Executed',
      message: `${num} ${serviceCategory} workers mobilized from ${fromDistrict} to ${toDistrict}`,
      targetRole: 'society_admin',
      type: 'success'
    });
    return res.json({ success: true, message: `Successfully mobilized ${num} workers from ${fromDistrict} to ${toDistrict}`, mobilizedCount: num, updatedDemand: target || null });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getNotifications(req, res) {
  try {
    const { limit = 20 } = req.query;
    const user = req.user;
    let notes = store.getCollection('notifications') || [];
    if (user.role === 'worker') {
      notes = notes.filter(n => !n.targetRole || n.targetRole === 'worker' || n.targetUserId === user.workerId || n.targetUserId === user.id || n.action?.includes('JOB'));
    }
    return res.json({ success: true, count: notes.length, notifications: notes.slice(0, Number(limit)) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getDividendPool(req, res) {
  try {
    const pool = store.dividendPool || { totalSurplus: 125000, distributionPeriod: 'Q3 2026' };
    const workers = store.getCollection('workers');
    const jobs = store.getCollection('jobs').filter(j => j.status === 'COMPLETED' || j.status === 'PAID');
    const totalJobs = jobs.length || 1;
    // Patronage weight = completed jobs * rating
    const workerDividends = workers.map(w => {
      const wJobs = jobs.filter(j => j.workerId === w.id).length;
      const weight = wJobs * (w.ratingAvg || 4.5);
      return { workerId: w.id, workerName: w.name, societyId: w.societyId, jobsCompleted: wJobs, weight, rating: w.ratingAvg };
    });
    const totalWeight = workerDividends.reduce((s, w) => s + w.weight, 0) || 1;
    const enriched = workerDividends.map(w => ({
      ...w,
      dividendAmount: Math.round((w.weight / totalWeight) * pool.totalSurplus),
      sharePercent: Math.round((w.weight / totalWeight) * 1000) / 10
    })).sort((a, b) => b.dividendAmount - a.dividendAmount);
    return res.json({ success: true, pool, totalWeight, dividends: enriched });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
}

export function distributeDividends(req, res) {
  try {
    const pool = store.dividendPool;
    if (!pool) return res.status(400).json({ success: false, message: 'No surplus pool configured.' });
    pool.status = 'Distributed';
    pool.distributedAt = new Date().toISOString();
    pool.distributedBy = req.user.name;
    store.logAudit({ actorName: req.user.name, actorRole: req.user.role, action: 'DIVIDEND_DISTRIBUTED', module: 'Federation Finance', recordId: 'DIVIDEND-2026', details: `Distributed surplus ₹${pool.totalSurplus} as patronage dividend` });
    store.pushNotification({ title: 'Patronage Dividend Distributed', message: `Surplus ₹${pool.totalSurplus} distributed to workers by patronage`, targetRole: 'worker', type: 'success' });
    return res.json({ success: true, message: `Dividend ₹${pool.totalSurplus} distributed successfully`, pool });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
}

export function getProposals(req, res) {
  try {
    const proposals = store.getCollection('proposals') || [];
    return res.json({ success: true, count: proposals.length, proposals });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
}

export function createProposal(req, res) {
  try {
    const { title, description, category = 'General' } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title required.' });
    const p = store.create('proposals', { title, description, category, proposedBy: req.user.name, proposedByRole: req.user.role, status: 'Active', votesFor: 0, votesAgainst: 0, totalEligible: store.getCollection('workers').length || 12, voters: [] });
    store.logAudit({ actorName: req.user.name, actorRole: req.user.role, action: 'PROPOSAL_CREATED', module: 'Governance', recordId: p.id, details: `New proposal: ${title}` });
    return res.status(201).json({ success: true, proposal: p });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
}

export function voteOnProposal(req, res) {
  try {
    const { id } = req.params;
    const { vote } = req.body; // 'for' | 'against'
    const prop = store.findById('proposals', id);
    if (!prop) return res.status(404).json({ success: false, message: 'Proposal not found.' });
    if (prop.voters?.includes(req.user.id)) return res.status(400).json({ success: false, message: 'Already voted.' });
    const updated = store.findByIdAndUpdate('proposals', id, {
      votesFor: vote === 'for' ? (prop.votesFor || 0) + 1 : prop.votesFor,
      votesAgainst: vote === 'against' ? (prop.votesAgainst || 0) + 1 : prop.votesAgainst,
      voters: [...(prop.voters || []), req.user.id]
    });
    // Auto-approve if majority
    const totalVotes = updated.votesFor + updated.votesAgainst;
    if (updated.votesFor > updated.totalEligible / 2) {
      store.findByIdAndUpdate('proposals', id, { status: 'Approved' });
      updated.status = 'Approved';
      store.logAudit({ actorName: 'Governance Engine', actorRole: 'system', action: 'PROPOSAL_APPROVED', module: 'Governance', recordId: id, details: `Proposal ${prop.title} approved by majority` });
    }
    return res.json({ success: true, proposal: updated });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
}

export function getToolInventory(req, res) {
  try {
    const tools = store.getCollection('toolInventory') || [];
    const loans = store.getCollection('toolLoans') || [];
    return res.json({ success: true, tools, loans });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
}

export function borrowTool(req, res) {
  try {
    const { toolId, days = 3 } = req.body;
    const tool = store.findById('toolInventory', toolId);
    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found.' });
    if (tool.availableUnits <= 0) return res.status(400).json({ success: false, message: 'No units available.' });
    const workerId = req.user.workerId || req.user.id;
    const loan = store.create('toolLoans', { toolId, toolName: tool.name, workerId, workerName: req.user.name, days: Number(days), status: 'Active', borrowedAt: new Date().toISOString(), dueAt: new Date(Date.now() + Number(days) * 86400000).toISOString(), fee: tool.perDayFee * Number(days) });
    // decrement availability
    const idx = store.getCollection('toolInventory').findIndex(t => t.id === toolId);
    if (idx !== -1) store.getCollection('toolInventory')[idx].availableUnits -= 1;
    store.logAudit({ actorName: req.user.name, actorRole: req.user.role, action: 'TOOL_BORROWED', module: 'Tool Library', recordId: loan.id, details: `${req.user.name} borrowed ${tool.name} for ${days} days` });
    return res.status(201).json({ success: true, loan });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
}

export function returnTool(req, res) {
  try {
    const { id } = req.params;
    const loan = store.findById('toolLoans', id);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found.' });
    store.findByIdAndUpdate('toolLoans', id, { status: 'Returned', returnedAt: new Date().toISOString() });
    const tool = store.findById('toolInventory', loan.toolId);
    if (tool) {
      const idx = store.getCollection('toolInventory').findIndex(t => t.id === tool.id);
      if (idx !== -1) store.getCollection('toolInventory')[idx].availableUnits += 1;
    }
    store.logAudit({ actorName: req.user.name, actorRole: req.user.role, action: 'TOOL_RETURNED', module: 'Tool Library', recordId: id, details: `Tool ${loan.toolName} returned` });
    return res.json({ success: true, message: 'Tool returned successfully' });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
}
