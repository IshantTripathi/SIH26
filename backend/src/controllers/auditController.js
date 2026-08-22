import { store } from '../data/store.js';

export function getAuditLogs(req, res) {
  try {
    const { module, action, actorRole, limit = 50 } = req.query;
    let logs = store.getCollection('auditLogs');

    if (module) logs = logs.filter(l => l.module?.toLowerCase() === module.toLowerCase());
    if (action) logs = logs.filter(l => l.action?.toLowerCase().includes(action.toLowerCase()));
    if (actorRole) logs = logs.filter(l => l.actorRole === actorRole);

    return res.json({
      success: true,
      count: logs.length,
      logs: logs.slice(0, Number(limit))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getAllServices(req, res) {
  try {
    const services = store.getCollection('services');
    return res.json({ success: true, count: services.length, services });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function addService(req, res) {
  try {
    const { category, title, description, basePrice, priceUnit, requiredCertifications, keywords } = req.body;
    if (!category || !title || !basePrice) {
      return res.status(400).json({ success: false, message: 'Category, title, and basePrice are required.' });
    }

    const newService = store.create('services', {
      id: `SERV-${category.toUpperCase().replace(/\s+/g, '-').slice(0, 10)}`,
      category,
      title,
      description: description || `${category} service`,
      basePrice: Number(basePrice),
      priceUnit: priceUnit || 'per visit',
      estimatedDurationMin: 60,
      requiredCertifications: requiredCertifications || [`CERT-DEMO-${category.toUpperCase().slice(0, 5)}`],
      keywords: keywords || [category.toLowerCase()]
    });

    store.logAudit({
      actorName: req.user?.name || 'Administrator',
      actorRole: req.user?.role || 'admin',
      action: 'SERVICE_CATEGORY_CREATED',
      module: 'Service Management',
      recordId: newService.id,
      details: `Added new service category: ${category} (Base: ₹${basePrice})`
    });

    return res.status(201).json({
      success: true,
      message: 'Service category added to cooperative catalogue.',
      service: newService
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
