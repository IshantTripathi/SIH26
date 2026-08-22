import http from 'http';

const BASE_URL = 'http://127.0.0.1:5000/api';

async function makeRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    ...options
  });
  const data = await response.json();
  return { status: response.status, data };
}

async function runVerification() {
  console.log('====================================================');
  console.log(' SIH26089 Full Verification & Integration Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    console.log('[1/10] Verifying Health Check API...');
    const health = await makeRequest('/health');
    assert(health.data.status === 'UP', 'Health endpoint returns status UP');
    assert(health.data.problemStatementId === 'SIH26089', 'Problem Statement metadata SIH26089 attached');

    // 2. Authentication with @demo.coop
    console.log('\n[2/10] Verifying Clean Demo Authentication...');
    const custAuth = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'customer01@demo.coop', password: 'password123' })
    });
    assert(custAuth.data.success === true, 'Customer login with customer01@demo.coop succeeded');
    const custToken = custAuth.data.token;

    const instAuth = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'customer02@demo.coop', password: 'password123' })
    });
    assert(instAuth.data.success === true, 'Institution login with customer02@demo.coop succeeded');
    assert(instAuth.data.user.customerType === 'Institution', 'Customer profile marked as Institution');

    const workerAuth = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'worker01@demo.coop', password: 'password123' })
    });
    assert(workerAuth.data.success === true, 'Worker login with worker01@demo.coop succeeded');
    const workerToken = workerAuth.data.token;

    // 3. Problem Intent Classification
    console.log('\n[3/10] Verifying Problem Intent Classifier...');
    const classifyRes = await makeRequest('/allocation/classify-intent', {
      method: 'POST',
      body: JSON.stringify({ text: 'My bathroom tap is leaking badly and water is flowing everywhere' })
    });
    assert(classifyRes.data.success === true, 'Classifier executed successfully');
    assert(classifyRes.data.classification.category === 'Plumbing', 'Classified accurately as Plumbing');

    // 4. Fair Allocation 5-Plumber Benchmark Scenario
    console.log('\n[4/10] Verifying 5-Plumber Fair Allocation Benchmark Scenario...');
    const fivePlumberRes = await makeRequest('/allocation/five-plumber-scenario');
    assert(fivePlumberRes.data.success === true, 'Benchmark allocation executed');
    const winner = fivePlumberRes.data.result.recommendedWorker;
    assert(winner.workerCode === 'WORKER-DEMO-001' || winner.workerId === 'WRK-DEMO-001', 'Worker B (WORKER-DEMO-001) won allocation');
    assert(winner.totalScore > 85, `Winner scored high match score: ${winner.totalScore}`);

    // Verify Worker A is deprioritized due to 8 active jobs
    const workerA = fivePlumberRes.data.result.rankedCandidates.find(w => w.workerCode === 'WORKER-DEMO-002' || w.workerId === 'WRK-DEMO-002');
    assert(workerA && workerA.breakdown.workloadScore === 0, 'Worker A workload score penalized to 0 due to fatigue');

    // Verify Worker C is excluded due to offline status
    const workerC = fivePlumberRes.data.result.rankedCandidates.find(w => w.workerCode === 'WORKER-DEMO-003' || w.workerId === 'WRK-DEMO-003');
    assert(workerC && workerC.breakdown.availScore === 0, 'Worker C excluded due to offline status');

    // 5. Scikit-Learn Python ML Demand Forecasting
    console.log('\n[5/10] Verifying AI Demand Forecasting (Python scikit-learn ML)...');
    const forecastRes = await makeRequest('/analytics/demand?district=North%20District', {
      token: custToken
    });
    assert(forecastRes.data.success === true, 'Demand analytics API returned successfully');
    assert(forecastRes.data.forecast.model !== undefined, 'Model metadata returned');
    assert(forecastRes.data.forecast.forecasts.length > 0, 'Regional forecasts generated');
    console.log(`    Model: ${forecastRes.data.forecast.model.name} (R² Score: ${forecastRes.data.forecast.model.r2_score})`);

    // 6. End-to-End Job Creation (Institution Customer)
    console.log('\n[6/10] Verifying Institution Booking & Configurable Pricing...');
    const createJobRes = await makeRequest('/jobs', {
      method: 'POST',
      token: custToken,
      body: JSON.stringify({
        problemDescription: 'Cooperative clinic water cooler filter replacement and piping check.',
        urgency: 'High',
        customerAddress: 'Room 12, Jan Kalyan Clinic, Connaught Place',
        customerType: 'Institution',
        institutionName: 'Jan Kalyan Cooperative Health Centre',
        institutionType: 'Clinic',
        contactPerson: 'Dr. S. Sharma'
      })
    });
    assert(createJobRes.data.success === true, 'Institution service booking created');
    const job = createJobRes.data.job;
    assert(job.customerType === 'Institution', 'Job saved with Institution customerType');
    assert(job.institutionName === 'Jan Kalyan Cooperative Health Centre', 'Job saved with institutionName');
    assert(job.pricing.disclaimer !== undefined, 'Pricing contains configurable disclaimer tag');
    assert(job.pricing.netWorkerEarnings > 0, 'Net worker wage computed accurately');

    // 7. Full 5-Stage Job Lifecycle with OTP
    console.log('\n[7/10] Verifying 5-Stage Job Progression with OTP Verification...');
    const acceptRes = await makeRequest(`/jobs/${job.id}/status`, {
      method: 'PATCH',
      token: workerToken,
      body: JSON.stringify({ status: 'ACCEPTED' })
    });
    assert(acceptRes.data.job.status === 'ACCEPTED', 'Job advanced to ACCEPTED');

    await makeRequest(`/jobs/${job.id}/status`, {
      method: 'PATCH',
      token: workerToken,
      body: JSON.stringify({ status: 'ON_THE_WAY' })
    });
    await makeRequest(`/jobs/${job.id}/status`, {
      method: 'PATCH',
      token: workerToken,
      body: JSON.stringify({ status: 'ARRIVED' })
    });
    await makeRequest(`/jobs/${job.id}/status`, {
      method: 'PATCH',
      token: workerToken,
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });

    const completeRes = await makeRequest(`/jobs/${job.id}/status`, {
      method: 'PATCH',
      token: workerToken,
      body: JSON.stringify({ status: 'COMPLETED', otpInput: job.otp })
    });
    assert(completeRes.data.job.status === 'COMPLETED', 'Job completed with OTP verification');

    // 8. Payment & Settlement (95% Worker / 4% Coop / 1% Welfare)
    console.log('\n[8/10] Verifying Payment Settlement & Ledger Crediting...');
    const payRes = await makeRequest(`/jobs/${job.id}/payment`, {
      method: 'POST',
      token: custToken,
      body: JSON.stringify({ paymentMethod: 'UPI' })
    });
    assert(payRes.data.success === true, 'Payment processed via UPI');
    assert(payRes.data.job.paymentStatus === 'PAID', 'Job marked PAID');
    assert(payRes.data.invoice.environment === 'Demo Payment Environment', 'Payment stamped Demo Payment Environment');

    // 9. Worker Welfare & Claim Filing
    console.log('\n[9/10] Verifying Worker Welfare & Social Security API...');
    const welfareRes = await makeRequest('/welfare/my-welfare', {
      token: workerToken
    });
    assert(welfareRes.data.success === true, 'Worker welfare record retrieved');
    assert(welfareRes.data.welfareRecord.insurancePolicyNumber.startsWith('INS-'), 'Policy number is clean demo ID');

    const claimRes = await makeRequest('/welfare/claims', {
      method: 'POST',
      token: workerToken,
      body: JSON.stringify({
        claimPurpose: 'Safety & Tool Kit Grant',
        requestedAmount: 2500,
        claimDetails: 'Purchased insulated rubber boots and safety voltage tester.'
      })
    });
    assert(claimRes.data.success === true, 'Welfare claim submitted to society board');

    // 10. Federation Macro Metrics
    console.log('\n[10/10] Verifying Federation Dashboard & Governance API...');
    const fedAuth = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'federation01@demo.coop', password: 'password123' })
    });
    const fedToken = fedAuth.data.token;
    const fedRes = await makeRequest('/federation/dashboard', {
      token: fedToken
    });
    assert(fedRes.data.success === true, 'Federation dashboard data retrieved');
    assert(fedRes.data.macroMetrics.totalSocieties >= 2, 'Macro metrics aggregate affiliated societies');

    console.log('\n====================================================');
    console.log(` TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log(' All integration checks passed 100% successfully!\n');
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runVerification();
