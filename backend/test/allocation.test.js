import test from 'node:test';
import assert from 'node:assert';
import { rankWorkersForJob, scoreWorkerForJob } from '../src/services/fairAllocationEngine.js';
import { classifyProblemDescription } from '../src/services/problemClassifier.js';
import { store } from '../src/data/store.js';

test('Fair Work Allocation Engine: Selects Worker B (Low Workload) over Worker A (8 Jobs) and Worker C (Offline)', () => {
  store.reset();
  const request = {
    serviceCategory: 'Plumbing',
    urgency: 'Normal',
    customerLocation: { lat: 28.6140, lng: 77.2095 }
  };

  const result = rankWorkersForJob(request);
  assert.ok(result.recommendedWorker, 'Must recommend a worker');
  assert.strictEqual(
    result.recommendedWorker.workerId,
    'WORKER-DEMO-001',
    'Worker B (WORKER-DEMO-001) should be the top ranked candidate due to fair workload distribution and verified status'
  );

  // Check that Worker C (offline) received 0 score
  const workerC = result.rankedCandidates.find(c => c.workerId === 'WORKER-DEMO-003');
  assert.strictEqual(workerC.totalScore, 0, 'Offline worker C should receive 0 total score');

  // Check that Worker B has a higher workload score than Worker A
  const workerA = result.rankedCandidates.find(c => c.workerId === 'WORKER-DEMO-002');
  const workerB = result.rankedCandidates.find(c => c.workerId === 'WORKER-DEMO-001');
  assert.ok(
    workerB.breakdown.workloadScore > workerA.breakdown.workloadScore,
    'Worker B must have higher workload score than overloaded Worker A'
  );
});

test('Problem-First Intent Classifier: Correctly identifies services from customer descriptions', () => {
  const t1 = classifyProblemDescription('I have a leaking kitchen tap');
  assert.strictEqual(t1.serviceCategory, 'Plumbing');
  assert.strictEqual(t1.serviceId, 'SERV-PLUMBING');

  const t2 = classifyProblemDescription('My ceiling fan is making a strange noise and sparked');
  assert.strictEqual(t2.serviceCategory, 'Electrical');
  assert.strictEqual(t2.suggestedUrgency, 'Emergency');

  const t3 = classifyProblemDescription('I need someone to clean my garden and trim grass');
  assert.strictEqual(t3.serviceCategory, 'Gardening');
});
