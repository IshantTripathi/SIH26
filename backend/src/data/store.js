import {
  initialFederations,
  initialSocieties,
  initialUsers,
  initialServices,
  initialWorkers,
  initialWelfareRecords,
  initialJobs,
  initialComplaints,
  initialDemandData,
  initialAuditLogs
} from './seedData.js';

class DataStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.federations = JSON.parse(JSON.stringify(initialFederations));
    this.societies = JSON.parse(JSON.stringify(initialSocieties));
    this.users = JSON.parse(JSON.stringify(initialUsers));
    this.services = JSON.parse(JSON.stringify(initialServices));
    this.workers = JSON.parse(JSON.stringify(initialWorkers));
    this.welfareRecords = JSON.parse(JSON.stringify(initialWelfareRecords));
    this.jobs = JSON.parse(JSON.stringify(initialJobs));
    this.complaints = JSON.parse(JSON.stringify(initialComplaints));
    this.demandData = JSON.parse(JSON.stringify(initialDemandData));
    this.auditLogs = JSON.parse(JSON.stringify(initialAuditLogs));
    this.welfareClaims = [];
    this.notifications = [];
    this.dividendPool = { totalSurplus: 125000, distributionPeriod: 'Q3 2026', status: 'Pending Distribution' };
    this.proposals = [
      { id: 'PROP-001', title: 'Reduce Society Cut to 3% for Festival Season', description: 'Temporarily reduce coop contribution from 4% to 3% to boost worker Diwali earnings', proposedBy: 'Worker Demo 01', status: 'Active', votesFor: 7, votesAgainst: 1, totalEligible: 12, createdAt: new Date().toISOString(), category: 'Contribution Policy' },
      { id: 'PROP-002', title: 'Add Solar Technician Trade', description: 'Add Solar PV Maintenance as new service category for green jobs', proposedBy: 'Federation Admin 01', status: 'Active', votesFor: 5, votesAgainst: 0, totalEligible: 12, createdAt: new Date().toISOString(), category: 'New Trade' }
    ];
    this.toolInventory = [
      { id: 'TOOL-001', name: 'Rotary Hammer Drill', category: 'Electrical', totalUnits: 4, availableUnits: 3, depositAmount: 500, perDayFee: 20, societyId: 'SOC-DEMO-001', condition: 'Good', borrowedBy: [] },
      { id: 'TOOL-002', name: 'Pressure Washer', category: 'Cleaning', totalUnits: 2, availableUnits: 2, depositAmount: 800, perDayFee: 30, societyId: 'SOC-DEMO-001', condition: 'Excellent', borrowedBy: [] },
      { id: 'TOOL-003', name: 'Pipe Inspection Camera', category: 'Plumbing', totalUnits: 1, availableUnits: 1, depositAmount: 1000, perDayFee: 50, societyId: 'SOC-DEMO-001', condition: 'Good', borrowedBy: [] },
      { id: 'TOOL-004', name: 'Ladder 12ft Aluminium', category: 'General', totalUnits: 3, availableUnits: 2, depositAmount: 300, perDayFee: 15, societyId: 'SOC-DEMO-002', condition: 'Good', borrowedBy: [] }
    ];
    this.toolLoans = [];
  }

  // Generic collection accessor
  getCollection(name) {
    if (!this[name]) {
      this[name] = [];
    }
    return this[name];
  }

  find(collectionName, filter = {}) {
    const list = this.getCollection(collectionName);
    return list.filter(item => {
      for (const [key, value] of Object.entries(filter)) {
        if (Array.isArray(item[key])) {
          if (!item[key].includes(value)) return false;
        } else if (item[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  findOne(collectionName, filter = {}) {
    const list = this.find(collectionName, filter);
    return list.length > 0 ? JSON.parse(JSON.stringify(list[0])) : null;
  }

  findById(collectionName, id) {
    const list = this.getCollection(collectionName);
    const item = list.find(it => it.id === id || it._id === id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  create(collectionName, data) {
    const list = this.getCollection(collectionName);
    const newItem = {
      ...data,
      id: data.id || `${collectionName.toUpperCase().slice(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: data.createdAt || new Date().toISOString()
    };
    list.unshift(newItem);
    return JSON.parse(JSON.stringify(newItem));
  }

  findByIdAndUpdate(collectionName, id, updateData) {
    const list = this.getCollection(collectionName);
    const index = list.findIndex(it => it.id === id || it._id === id);
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    return JSON.parse(JSON.stringify(list[index]));
  }

  findByIdAndDelete(collectionName, id) {
    const list = this.getCollection(collectionName);
    const index = list.findIndex(it => it.id === id || it._id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    return true;
  }

  logAudit({ actorName, actorRole, action, module, recordId, details }) {
    const entry = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actorName: actorName || 'System',
      actorRole: actorRole || 'system',
      action,
      module: module || 'General',
      recordId: recordId || 'N/A',
      details: details || '',
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(entry);
    // also push as notification for relevant users
    this.notifications.unshift({ ...entry, read: false });
    if (this.notifications.length > 100) this.notifications.pop();
    return entry;
  }

  pushNotification({ title, message, targetRole, targetUserId, type = 'info' }) {
    const note = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      message,
      targetRole,
      targetUserId,
      type,
      read: false,
      timestamp: new Date().toISOString()
    };
    this.notifications.unshift(note);
    return note;
  }
}

export const store = new DataStore();
