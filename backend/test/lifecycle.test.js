import test from 'node:test';
import assert from 'node:assert';
import { store } from '../src/data/store.js';
import { createJobRequest, updateJobStatus, processPayment, submitRating } from '../src/controllers/jobsController.js';
import { calculateWorkerDividend } from '../src/services/dividendCalcService.js';
import { JOB_STATUSES, ROLES } from '../src/config/constants.js';

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

test('End-to-End Lifecycle: Booking → Allocation → OTP Completion → Payment → Rating → Dividend', () => {
  store.reset(false);

  const customerUser = {
    id: 'USR-CUST-001',
    name: 'Rajesh Kumar',
    role: ROLES.CUSTOMER,
    mobile: '9876510001',
    location: { lat: 28.6140, lng: 77.2095 },
    address: '123 Central Delhi Resident Area'
  };

  // 1. Create Job Request
  const { req: bookReq, res: bookRes } = mockReqRes({
    body: {
      serviceCategory: 'Plumbing',
      problemDescription: 'Kitchen drain severely clogged and overflowing',
      urgency: 'Normal',
      durationHours: 1
    },
    user: customerUser
  });

  createJobRequest(bookReq, bookRes);
  assert.strictEqual(bookRes.statusCode, 201);
  assert.strictEqual(bookRes.data.success, true);
  const createdJob = bookRes.data.job;
  assert.ok(createdJob.id);
  assert.ok(createdJob.workerId, 'Worker must be matched by Fair Allocation Engine');
  assert.ok(createdJob.otp, 'Completion OTP must be generated');
  assert.strictEqual(createdJob.pricing.grossAmount, 450);
  assert.strictEqual(createdJob.pricing.coopContribution, 18); // 4% of 450
  assert.strictEqual(createdJob.pricing.welfareDeduction, 4.5);  // 1% of 450
  assert.strictEqual(createdJob.pricing.netWorkerEarnings, 427.5); // 95% of 450

  const assignedWorkerId = createdJob.workerId;
  const assignedWorkerUser = {
    id: 'USR-WRK-MATCHED',
    name: createdJob.workerName,
    role: ROLES.WORKER,
    workerId: assignedWorkerId
  };

  // 2. Worker transitions job: OFFERED → ACCEPTED → ON_THE_WAY → ARRIVED → IN_PROGRESS
  const steps = [
    JOB_STATUSES.ACCEPTED,
    JOB_STATUSES.ON_THE_WAY,
    JOB_STATUSES.ARRIVED,
    JOB_STATUSES.IN_PROGRESS
  ];

  for (const step of steps) {
    const { req: stepReq, res: stepRes } = mockReqRes({
      params: { id: createdJob.id },
      body: { status: step },
      user: assignedWorkerUser
    });
    updateJobStatus(stepReq, stepRes);
    assert.strictEqual(stepRes.statusCode, 200);
    assert.strictEqual(stepRes.data.job.status, step);
  }

  // 3. Worker attempts completion with invalid OTP -> should be rejected
  const { req: badOtpReq, res: badOtpRes } = mockReqRes({
    params: { id: createdJob.id },
    body: { status: JOB_STATUSES.COMPLETED, otpInput: '0000' },
    user: assignedWorkerUser
  });
  updateJobStatus(badOtpReq, badOtpRes);
  assert.strictEqual(badOtpRes.statusCode, 400);

  // 4. Worker completes with valid OTP
  const { req: goodOtpReq, res: goodOtpRes } = mockReqRes({
    params: { id: createdJob.id },
    body: { status: JOB_STATUSES.COMPLETED, otpInput: createdJob.otp },
    user: assignedWorkerUser
  });
  updateJobStatus(goodOtpReq, goodOtpRes);
  assert.strictEqual(goodOtpRes.statusCode, 200);
  assert.strictEqual(goodOtpRes.data.job.status, JOB_STATUSES.COMPLETED);

  // 5. Customer processes payment
  const { req: payReq, res: payRes } = mockReqRes({
    params: { id: createdJob.id },
    body: { paymentMethod: 'UPI Direct', transactionRef: 'DEMO-UPI-TXN-9988' },
    user: customerUser
  });
  processPayment(payReq, payRes);
  assert.strictEqual(payRes.statusCode, 200);
  assert.strictEqual(payRes.data.job.paymentStatus, 'PAID');
  assert.ok(payRes.data.invoice.invoiceNumber);

  // 6. Customer rates worker
  const { req: rateReq, res: rateRes } = mockReqRes({
    params: { id: createdJob.id },
    body: { score: 5, comment: 'Excellent prompt service!' },
    user: customerUser
  });
  submitRating(rateReq, rateRes);
  assert.strictEqual(rateRes.statusCode, 200);
  assert.strictEqual(rateRes.data.job.rating.score, 5);

  // 7. Verify cooperative dividend reflects member contributions
  const dividend = calculateWorkerDividend(assignedWorkerId);
  assert.ok(dividend);
  assert.strictEqual(dividend.workerId, assignedWorkerId);
  assert.ok(dividend.contribution.totalJobsCompleted >= 1);
});
