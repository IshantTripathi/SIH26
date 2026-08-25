import test from 'node:test';
import assert from 'node:assert';
import { executeTool, geminiToolDeclarations } from '../src/services/geminiTools.js';
import { chatWithGemini, buildSystemInstruction } from '../src/services/geminiService.js';
import { store } from '../src/data/store.js';
import { ROLES, VERIFICATION_STATUS } from '../src/config/constants.js';

test('AI Assistant Tools: All declared tools are strictly read-only', () => {
  assert.ok(Array.isArray(geminiToolDeclarations), 'Tools must be an array');
  assert.strictEqual(geminiToolDeclarations.length, 12, 'Must have 12 read-only tools defined');

  // Verify none of the tools allow destructive/modifying operations
  const forbiddenPatterns = ['delete', 'update', 'insert', 'create', 'drop', 'remove', 'pay', 'cancel', 'book'];
  for (const tool of geminiToolDeclarations) {
    for (const forbidden of forbiddenPatterns) {
      assert.ok(
        !tool.name.toLowerCase().startsWith(forbidden),
        `Tool ${tool.name} must not be a modifying action`
      );
    }
  }
});

test('AI Assistant Tools: getActiveWorkers queries live database store accurately', async () => {
  store.reset();
  const customerUser = { role: ROLES.CUSTOMER, id: 'USR-CUST-001', name: 'Customer Demo 01' };

  const result = await executeTool('getActiveWorkers', { serviceType: 'Plumbing', isOnline: true }, customerUser);
  assert.strictEqual(result.success, true);
  assert.ok(result.count > 0, 'Should find active plumbers');
  assert.ok(result.verifiedCount > 0, 'Should count verified plumbers');

  // Check that worker objects contain expected public fields without sensitive credentials
  const firstWorker = result.workers[0];
  assert.ok(firstWorker.id, 'Worker must have id');
  assert.ok(firstWorker.name, 'Worker must have name');
  assert.ok(firstWorker.ratingAvg, 'Worker must have ratingAvg');
  assert.strictEqual(firstWorker.password, undefined, 'Must NEVER expose password');
});

test('AI Assistant Tools: findNearbyWorkers calculates distance accurately', async () => {
  store.reset();
  const customerUser = {
    role: ROLES.CUSTOMER,
    id: 'USR-CUST-001',
    name: 'Customer Demo 01',
    location: { lat: 28.6140, lng: 77.2095, area: 'Connaught Place' }
  };

  const result = await executeTool('findNearbyWorkers', { serviceType: 'Plumbing', radiusKm: 3 }, customerUser);
  assert.strictEqual(result.success, true);
  assert.ok(Array.isArray(result.nearbyWorkers));
  assert.ok(result.count > 0);

  // All returned workers must be within search radius
  for (const w of result.nearbyWorkers) {
    assert.ok(w.distanceKm <= 3, `Worker distance ${w.distanceKm} must be within 3 km radius`);
  }
});

test('AI Assistant Privacy: getCustomerJobs only returns authenticated customer records', async () => {
  store.reset();
  const customer1 = { role: ROLES.CUSTOMER, id: 'USR-CUST-001', name: 'Customer Demo 01' };
  const customer2 = { role: ROLES.CUSTOMER, id: 'USR-CUST-002', name: 'Customer Demo 02' };

  const result1 = await executeTool('getCustomerJobs', {}, customer1);
  assert.strictEqual(result1.success, true);
  assert.strictEqual(result1.customerId, 'USR-CUST-001');

  for (const j of result1.jobs) {
    const original = store.findById('jobs', j.id);
    assert.strictEqual(original.customerId, 'USR-CUST-001', 'Must strictly belong to Customer 01');
  }

  const result2 = await executeTool('getCustomerJobs', {}, customer2);
  assert.strictEqual(result2.success, true);
  assert.strictEqual(result2.customerId, 'USR-CUST-002');
});

test('AI Assistant Privacy: getWorkerJobs enforces worker role authorization', async () => {
  store.reset();
  const customerUser = { role: ROLES.CUSTOMER, id: 'USR-CUST-001', name: 'Customer Demo 01' };
  const workerUser = { role: ROLES.WORKER, id: 'USR-WRK-001', workerId: 'WORKER-DEMO-001', name: 'Worker Demo 01' };

  // Customer attempting to call worker jobs must be denied
  const custCall = await executeTool('getWorkerJobs', {}, customerUser);
  assert.strictEqual(custCall.success, false, 'Customer cannot access worker job feed');

  // Worker calling worker jobs succeeds with their own records
  const wrkCall = await executeTool('getWorkerJobs', {}, workerUser);
  assert.strictEqual(wrkCall.success, true);
  assert.strictEqual(wrkCall.workerId, 'WORKER-DEMO-001');
});

test('AI Assistant Forecast: Returns model metadata with Demo tag', async () => {
  store.reset();
  const fedAdmin = { role: ROLES.FEDERATION_ADMIN, id: 'USR-FED-001', name: 'Federation Admin 01' };

  const result = await executeTool('getLatestForecast', { district: 'all', category: 'Plumbing' }, fedAdmin);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.tag, 'Model Estimate — Demo');
  assert.ok(result.metrics, 'Must return forecasting metrics');
});

test('AI Assistant Rationale: explainWorkerRecommendation returns multi-factor allocation breakdown', async () => {
  store.reset();
  const customerUser = { role: ROLES.CUSTOMER, id: 'USR-CUST-001', name: 'Customer Demo 01' };

  const result = await executeTool('explainWorkerRecommendation', { serviceCategory: 'Plumbing' }, customerUser);
  assert.strictEqual(result.success, true);
  assert.ok(result.breakdown, 'Must contain scoring breakdown');
  assert.ok(result.recommendationReason, 'Must contain human-readable reason');
  assert.ok(Array.isArray(result.cooperativePillars), 'Must list cooperative pillars');
});

test('AI System Instruction: Adapts correctly to authenticated user role', () => {
  const custSys = buildSystemInstruction({ role: ROLES.CUSTOMER, name: 'Demo Customer' });
  assert.ok(custSys.includes('CURRENT USER ROLE: CUSTOMER'));
  assert.ok(custSys.includes('95% direct worker payout'));

  const wrkSys = buildSystemInstruction({ role: ROLES.WORKER, name: 'Demo Worker', workerId: 'WORKER-DEMO-001' });
  assert.ok(wrkSys.includes('CURRENT USER ROLE: COOPERATIVE WORKER'));
  assert.ok(wrkSys.includes('welfare benefits'));

  const fedSys = buildSystemInstruction({ role: ROLES.FEDERATION_ADMIN, name: 'Demo Fed Admin' });
  assert.ok(fedSys.includes('CURRENT USER ROLE: COOPERATIVE FEDERATION ADMIN'));
  assert.ok(fedSys.includes('demand forecasting'));
});

test('AI Chat Engine: Answers customer queries with live database figures', async () => {
  store.reset();
  const customerUser = { role: ROLES.CUSTOMER, id: 'USR-CUST-001', name: 'Customer Demo 01' };

  const response = await chatWithGemini({
    user: customerUser,
    message: 'Are there any verified plumbers available nearby?'
  });

  assert.ok(response.reply, 'Must return a reply');
  assert.ok(response.reply.length > 20, 'Reply must be substantial');
  assert.ok(response.toolsUsed.includes('getActiveWorkers'), 'Must use getActiveWorkers tool');
});
