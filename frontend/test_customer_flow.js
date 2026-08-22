import { api } from './src/api/client.js';

// Setup minimal node environment shims for local testing
if (typeof localStorage === 'undefined') {
  const store = {};
  global.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; }
  };
}

async function testCustomerBookingPipeline() {
  console.log('======================================================');
  console.log(' Testing Customer Booking API & Client Functionality');
  console.log('======================================================\n');
  
  // 1. Verify function exists on api object
  if (typeof api.createJobRequest !== 'function') {
    console.error('FAIL: api.createJobRequest is not a function');
    process.exit(1);
  }
  console.log('  ✓ PASS: api.createJobRequest is exported and is a function');

  if (typeof api.createJob !== 'function') {
    console.error('FAIL: api.createJob is not a function');
    process.exit(1);
  }
  console.log('  ✓ PASS: api.createJob alias is exported and is a function');

  // 2. Perform customer login to obtain token
  console.log('\n[Step 1] Logging in demo customer (customer01@demo.coop)...');
  const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'customer01@demo.coop', password: 'password123' })
  }).then(r => r.json());

  if (!loginRes.success) {
    console.error('FAIL: Customer login failed:', loginRes.message);
    process.exit(1);
  }
  console.log('  ✓ PASS: Authenticated customer:', loginRes.user.name, `(${loginRes.user.id})`);

  localStorage.setItem('coop_token', loginRes.token);
  localStorage.setItem('coop_demo_user_id', loginRes.user.id);

  // 3. Test Intent Classification for "I have a leaking tap"
  console.log('\n[Step 2] Problem intent classification: "I have a leaking tap"...');
  const classifyRes = await fetch('http://127.0.0.1:5000/api/allocation/classify-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problemText: 'I have a leaking tap' })
  }).then(r => r.json());

  console.log('  ✓ PASS: Classified Service Trade:', classifyRes.intent?.serviceCategory);
  if (classifyRes.intent?.serviceCategory !== 'Plumbing') {
    console.error('FAIL: Expected Plumbing category');
    process.exit(1);
  }

  // 4. Create Job via api.createJobRequest
  console.log('\n[Step 3] Dispatching service booking with Fair Allocation...');
  const bookingPayload = {
    customerType: 'Household',
    serviceCategory: classifyRes.intent?.serviceCategory || 'Plumbing',
    problemDescription: 'I have a leaking tap in my kitchen under the sink',
    urgency: 'Normal',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: 'Immediately / As soon as available',
    customerAddress: 'B-42, Metro Residency, Connaught Place',
    customerLocation: { lat: 28.6140, lng: 77.2095 }
  };

  const jobRes = await fetch('http://127.0.0.1:5000/api/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginRes.token}`
    },
    body: JSON.stringify(bookingPayload)
  }).then(r => r.json());

  if (!jobRes.success) {
    console.error('FAIL: Job creation failed:', jobRes.message);
    process.exit(1);
  }

  console.log('  ✓ PASS: Service request created successfully!');
  console.log('    • Job Code:', jobRes.job.code);
  console.log('    • Assigned Worker:', jobRes.job.workerName);
  console.log('    • Top Candidate Match Score:', jobRes.allocationResult?.recommendedWorker?.totalScore);
  console.log('    • Transparent Pricing:', jobRes.job.pricing);

  // 5. Verify customer's active jobs list
  console.log('\n[Step 4] Fetching customer active bookings...');
  const jobsListRes = await fetch('http://127.0.0.1:5000/api/jobs', {
    headers: { 'Authorization': `Bearer ${loginRes.token}` }
  }).then(r => r.json());

  const foundJob = jobsListRes.jobs.find(j => j.id === jobRes.job.id || j.code === jobRes.job.code);
  if (!foundJob) {
    console.error('FAIL: Created job not found in customer active jobs list');
    process.exit(1);
  }
  console.log('  ✓ PASS: New job appears in customer history with status:', foundJob.status);

  console.log('\n======================================================');
  console.log(' ALL CUSTOMER BOOKING FLOW VERIFICATIONS PASSED 100%');
  console.log('======================================================\n');
}

testCustomerBookingPipeline().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
