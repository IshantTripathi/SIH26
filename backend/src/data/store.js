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
    return entry;
  }
}

export const store = new DataStore();
