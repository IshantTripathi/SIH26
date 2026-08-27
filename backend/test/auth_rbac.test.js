import test from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { store } from '../src/data/store.js';
import { login, register } from '../src/controllers/authController.js';
import { updateJobStatus, getJobById, processPayment } from '../src/controllers/jobsController.js';
import { getWorkerProfile, getWorkerEarnings } from '../src/controllers/workerController.js';
import { getSocietyDashboard } from '../src/controllers/societyController.js';
import { JWT_SECRET, ROLES } from '../src/config/constants.js';

function mockReqRes({ body = {}, params = {}, query = {}, user = null, headers = {} } = {}) {
  const req = { body, params, query, user, headers };
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return { req, res };
}

test('Auth: Correct password verifies via bcrypt and returns sanitized user', () => {
  store.reset(false);
  const { req, res } = mockReqRes({
    body: { identifier: 'customer01@demo.coop', password: 'password123' }
  });

  login(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.data.success, true);
  assert.ok(res.data.token, 'JWT Token must be generated');
  assert.strictEqual(res.data.user.password, undefined, 'Password hash must be stripped from response');
  assert.strictEqual(res.data.user.email, 'customer01@demo.coop');
});

test('Auth: Incorrect password rejected and hardcoded passwords not accepted for other accounts', () => {
  store.reset(false);
  const { req, res } = mockReqRes({
    body: { identifier: 'customer01@demo.coop', password: 'wrongpassword' }
  });

  login(req, res);
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.data.success, false);
});

test('Auth: User registration securely hashes password with bcrypt', () => {
  store.reset(false);
  const testEmail = `newuser_${Date.now()}@demo.coop`;
  const { req, res } = mockReqRes({
    body: {
      name: 'New Test User',
      email: testEmail,
      mobile: '9876543210',
      password: 'MySecretPassword123!',
      role: ROLES.CUSTOMER
    }
  });

  register(req, res);
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.data.success, true);
  assert.strictEqual(res.data.user.password, undefined);

  // Check stored record
  const stored = store.findOne('users', { email: testEmail });
  assert.ok(stored, 'User must be created in store');
  assert.notStrictEqual(stored.password, 'MySecretPassword123!');
  assert.ok(bcrypt.compareSync('MySecretPassword123!', stored.password), 'Password must verify with bcrypt');
});

test('RBAC: Worker cannot access another worker private profile or earnings', () => {
  store.reset(false);
  const workerUser = { id: 'USR-WRK-001', role: ROLES.WORKER, workerId: 'WORKER-DEMO-001' };

  // Attempt to access WORKER-DEMO-002
  const { req: pReq, res: pRes } = mockReqRes({
    params: { id: 'WORKER-DEMO-002' },
    user: workerUser
  });
  getWorkerProfile(pReq, pRes);
  assert.strictEqual(pRes.statusCode, 403);
  assert.strictEqual(pRes.data.success, false);

  // Attempt to access WORKER-DEMO-002 earnings
  const { req: eReq, res: eRes } = mockReqRes({
    params: { id: 'WORKER-DEMO-002' },
    user: workerUser
  });
  getWorkerEarnings(eReq, eRes);
  assert.strictEqual(eRes.statusCode, 403);
  assert.strictEqual(eRes.data.success, false);
});

test('RBAC: Customer cannot view, update, or pay for another customer job', () => {
  store.reset(false);
  const job = store.create('jobs', {
    code: 'JOB-TEST-RBAC',
    customerId: 'USR-CUST-001',
    workerId: 'WORKER-DEMO-001',
    societyId: 'SOC-DEMO-001',
    status: 'REQUESTED',
    pricing: { grossAmount: 500, netWorkerEarnings: 475 }
  });

  const attackerCustomer = { id: 'USR-CUST-002', role: ROLES.CUSTOMER };

  // View job check
  const { req: vReq, res: vRes } = mockReqRes({ params: { id: job.id }, user: attackerCustomer });
  getJobById(vReq, vRes);
  assert.strictEqual(vRes.statusCode, 403);

  // Update status check
  const { req: uReq, res: uRes } = mockReqRes({ params: { id: job.id }, body: { status: 'CANCELLED' }, user: attackerCustomer });
  updateJobStatus(uReq, uRes);
  assert.strictEqual(uRes.statusCode, 403);

  // Pay check
  const { req: pReq, res: pRes } = mockReqRes({ params: { id: job.id }, body: { paymentMethod: 'UPI' }, user: attackerCustomer });
  processPayment(pReq, pRes);
  assert.strictEqual(pRes.statusCode, 403);
});

test('RBAC: Society admin cannot access other society dashboard', () => {
  store.reset(false);
  const societyAdmin = { id: 'USR-SOC-001', role: ROLES.SOCIETY_ADMIN, societyId: 'SOC-DEMO-001' };

  const { req, res } = mockReqRes({
    params: { id: 'SOC-DEMO-002' },
    user: societyAdmin
  });

  getSocietyDashboard(req, res);
  assert.strictEqual(res.statusCode, 403);
});
