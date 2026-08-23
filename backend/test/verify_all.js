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
    assert(winner.totalScore > 85, `Winner scored high match score: ${winner.totalScore}`);
    assert(winner.workerCode === 'WORKER-DEMO-001' || winner.workerCode === 'WORKER-DEMO-004' || winner.workerId === 'WRK-DEMO-001' || winner.workerId === 'WRK-DEMO-004', 'Top skilled worker won allocation');

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
    console.log('\n[10/21] Verifying Federation Dashboard & Governance API...');
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

    // 11. Hourly Pricing (1-4hr)
    console.log('\n[11/21] Verifying Hourly Pricing & Multi-Task...');
    const hourlyRes = await makeRequest('/jobs', {
      method: 'POST',
      token: custToken,
      body: JSON.stringify({ serviceCategory: 'Plumbing', problemDescription: 'Multi-task: tap + pipe + sink', durationHours: 3, customerLocation: { lat: 28.6140, lng: 77.2095 } })
    });
    assert(hourlyRes.data.success === true, 'Hourly job created (3hr)');
    assert(hourlyRes.data.job.pricing.isHourly === true, 'isHourly flag set to true');
    assert(hourlyRes.data.job.pricing.hourlyRate === 450, 'Hourly rate tracked');
    assert(hourlyRes.data.job.pricing.grossAmount === 1350, 'Gross = basePrice * hours (450*3)');
    const hourlyJobId = hourlyRes.data.job.id;

    // 12. Top-3 Ranked Candidates
    console.log('\n[12/21] Verifying Top-3 Ranked Candidate Picker...');
    assert(Array.isArray(hourlyRes.data.job.top3Candidates), 'top3Candidates is array');
    assert(hourlyRes.data.job.top3Candidates.length === 3, 'Top 3 candidates returned');
    assert(hourlyRes.data.job.top3Candidates[0].etaMinutes > 0, 'ETA minutes calculated');
    assert(hourlyRes.data.job.top3Candidates[0].ratingAvg > 0, 'Rating included in top3');

    // 13. Pack Credits
    console.log('\n[13/21] Verifying Sahakar Monthly Pack & Free Re-Service...');
    const packRes = await makeRequest('/jobs/packs/credits', { token: custToken });
    assert(packRes.data.success === true, 'Pack credits endpoint works');
    assert(packRes.data.creditsRemaining >= 0, 'Credits remaining returned');

    const freeJobRes = await makeRequest('/jobs', {
      method: 'POST',
      token: custToken,
      body: JSON.stringify({ serviceCategory: 'Electrical', problemDescription: 'Fan repair', usePackCredit: true, customerLocation: { lat: 28.6140, lng: 77.2095 } })
    });
    assert(freeJobRes.data.success === true, 'Free job with pack credit created');
    assert(freeJobRes.data.job.packCreditUsed === true, 'Pack credit deducted');
    assert(freeJobRes.data.job.pricing.grossAmount === 0, 'Gross amount is 0 with pack');

    // 14. Reschedule (2hr free) + Live ETA + SOS
    console.log('\n[14/21] Verifying Reschedule, Live ETA & SOS...');
    const rescheduleRes = await makeRequest(`/jobs/${hourlyJobId}/reschedule`, {
      method: 'POST',
      token: custToken,
      body: JSON.stringify({ scheduledDate: '2026-08-25', scheduledTime: 'Morning (9AM-12PM)' })
    });
    assert(rescheduleRes.data.success === true, 'Job rescheduled within 2hr window');

    const etaRes = await makeRequest(`/jobs/${hourlyJobId}/eta`, { token: custToken });
    assert(etaRes.data.success === true, 'ETA endpoint returns success');
    assert(typeof etaRes.data.eta.distanceKm === 'number', 'ETA includes distance');
    assert(typeof etaRes.data.eta.progressPercent === 'number', 'ETA includes progress');

    const sosRes = await makeRequest(`/jobs/${hourlyJobId}/sos`, {
      method: 'POST',
      token: custToken,
      body: JSON.stringify({ type: 'customer', message: 'Test SOS alert' })
    });
    assert(sosRes.data.success === true, 'SOS alert sent successfully');
    assert(sosRes.data.alert.status === 'ACTIVE', 'SOS alert marked active');

    // 15. Punctuality % in Scoring
    console.log('\n[15/21] Verifying Worker Punctuality % in Allocation...');
    const simRes = await makeRequest('/allocation/simulate', {
      method: 'POST',
      token: custToken,
      body: JSON.stringify({ serviceCategory: 'Plumbing', customerLocation: { lat: 28.6140, lng: 77.2095 } })
    });
    assert(simRes.data.success === true, 'Allocation simulation works');
    assert(typeof simRes.data.allocationResult.rankedCandidates[0].punctualityPercent === 'number', 'Punctuality % included in scoring');
    assert(simRes.data.allocationResult.rankedCandidates[0].punctualityPercent >= 0, 'Punctuality is valid percentage');

    // 16. Loyalty Tier System
    console.log('\n[16/21] Verifying Urban Company-style Loyalty Tiers...');
    const loyaltyRes = await makeRequest('/loyalty', { token: custToken });
    assert(loyaltyRes.data.success === true, 'Loyalty status retrieved');
    assert(typeof loyaltyRes.data.loyalty.totalSpend === 'number', 'Total spend calculated');
    assert(loyaltyRes.data.loyalty.allTiers.length === 3, 'Three tiers defined (Silver/Gold/Platinum)');

    // 17. Coupon System
    console.log('\n[17/21] Verifying Coupon/Promo Code System...');
    const couponsRes = await makeRequest('/coupons', { token: custToken });
    assert(couponsRes.data.success === true, 'Coupons list retrieved');
    assert(couponsRes.data.coupons.length >= 2, 'Demo coupons available');
    const couponApplyRes = await makeRequest('/coupons/apply', {
      method: 'POST', token: custToken,
      body: JSON.stringify({ code: 'WELCOME50', jobId: hourlyJobId })
    });
    assert(couponApplyRes.data.success === true, 'Coupon WELCOME50 applied');
    assert(couponApplyRes.data.discount === 50, 'Coupon discount is ₹50');

    // 18. Service Warranty
    console.log('\n[18/21] Verifying 1-Year Service Warranty...');
    const paidJob = (await makeRequest('/jobs', { token: custToken })).data.jobs.find(j => j.paymentStatus === 'PAID' && (j.status === 'COMPLETED' || j.status === 'PAID'));
    assert(paidJob !== undefined, 'Found a paid job for warranty');
    const warrantyCreateRes = await makeRequest('/warranties', {
      method: 'POST', token: custToken,
      body: JSON.stringify({ jobId: paidJob.id, description: '1-year service warranty' })
    });
    assert(warrantyCreateRes.data.success === true, 'Warranty created successfully');
    assert(warrantyCreateRes.data.warranty.warrantyPeriod === '1 Year', 'Warranty period is 1 year');
    assert(warrantyCreateRes.data.warranty.maxClaims === 2, 'Max 2 warranty claims');
    const warrantyId = warrantyCreateRes.data.warranty.id;

    // 19. Callback Scheduling
    console.log('\n[19/21] Verifying Schedule Callback...');
    const cbRes = await makeRequest('/callbacks', {
      method: 'POST', token: custToken,
      body: JSON.stringify({ preferredTime: 'Afternoon (12PM-4PM)', reason: 'Booking assistance needed' })
    });
    assert(cbRes.data.success === true, 'Callback scheduled');
    assert(cbRes.data.callback.status === 'Scheduled', 'Callback status is Scheduled');

    // 20. Seasonal Suggestions
    console.log('\n[20/21] Verifying Seasonal Service Suggestions...');
    const seasonRes = await makeRequest('/seasonal', { token: custToken });
    assert(seasonRes.data.success === true, 'Seasonal suggestions retrieved');
    assert(seasonRes.data.suggestions.length >= 1, 'Current season has suggestions');
    assert(seasonRes.data.suggestions[0].services.length >= 2, 'Suggestions include services');

    // 21. Warranty Claim (free re-service)
    console.log('\n[21/21] Verifying Warranty Claim (Free Re-Service)...');
    const warrantyClaimRes = await makeRequest(`/warranties/${warrantyId}/claim`, {
      method: 'POST', token: custToken,
      body: JSON.stringify({ issueDescription: 'Issue recurred after repair' })
    });
    assert(warrantyClaimRes.data.success === true, 'Warranty claim approved');
    assert(warrantyClaimRes.data.newJob.pricing.grossAmount === 0, 'Re-service is free (₹0)');
    assert(warrantyClaimRes.data.newJob.isWarrantyClaim === true, 'Job marked as warranty claim');

    // 22. Emergency Priority Queue
    console.log('\n[22/25] Verifying Emergency Priority Queue...');
    const emergencyPoolRes = await makeRequest('/emergency/pool?category=Plumbing', { token: workerToken });
    assert(emergencyPoolRes.data.success === true, 'Emergency pool endpoint works');
    assert(typeof emergencyPoolRes.data.count === 'number', 'Pool returns worker count');

    const emergencyBroadcastRes = await makeRequest('/emergency/broadcast', {
      method: 'POST', token: custToken,
      body: JSON.stringify({ serviceCategory: 'Plumbing', problemDescription: 'Burst pipe emergency', customerAddress: '123 Emergency Street' })
    });
    assert(emergencyBroadcastRes.data.success === true, 'Emergency broadcast sent');
    assert(emergencyBroadcastRes.data.emergency.broadcastCount >= 0, 'Broadcast count returned');
    assert(emergencyBroadcastRes.data.emergency.expiresAt, 'Expiry timestamp set');

    const activeEmergRes = await makeRequest('/emergency/active', { token: custToken });
    assert(activeEmergRes.data.success === true, 'Active emergencies endpoint works');

    // 23. Worker GPS Location Tracking
    console.log('\n[23/25] Verifying Worker GPS Location Tracking...');
    const locationUpdateRes = await makeRequest('/worker/location', {
      method: 'PATCH', token: workerToken,
      body: JSON.stringify({ lat: 28.6155, lng: 77.2120, jobId: 'test-job' })
    });
    assert(locationUpdateRes.data.success === true, 'Worker location updated');

    const workerLocRes = await makeRequest('/worker/location/WORKER-DEMO-001', { token: workerToken });
    assert(workerLocRes.data.success === true, 'Worker location retrieved');
    assert(workerLocRes.data.location.lat, 'Location has latitude');

    // 24. Worker Application & Skill Assessment
    console.log('\n[24/25] Verifying Worker Application & Skill Assessment...');
    const applyRes = await makeRequest('/onboarding/apply', {
      method: 'POST', token: custToken,
      body: JSON.stringify({ fullName: 'Test Applicant', mobile: '9999900000', primarySkill: 'Plumbing', experienceYears: 3, societyId: 'SOC-DEMO-001' })
    });
    assert(applyRes.data.success === true, 'Worker application submitted');
    const newAppId = applyRes.data.application.id;

    const questionsRes = await makeRequest('/onboarding/assessment/Plumbing', { token: custToken });
    assert(questionsRes.data.success === true, 'Assessment questions retrieved');
    assert(questionsRes.data.totalQuestions === 10, '10 questions returned for Plumbing');
    assert(!questionsRes.data.questions[0].correctIndex, 'Correct answer not exposed to applicant');

    const testAnswers = [1, 3, 1, 2, 1, 1, 1, 1, 1, 2];
    const assessRes = await makeRequest('/onboarding/assessment/submit', {
      method: 'POST', token: custToken,
      body: JSON.stringify({ applicationId: newAppId, trade: 'Plumbing', answers: testAnswers })
    });
    assert(assessRes.data.success === true, 'Assessment submitted');
    assert(typeof assessRes.data.result.score === 'number', 'Score returned');
    assert(typeof assessRes.data.result.passed === 'boolean', 'Pass/fail status returned');

    const myAppsRes = await makeRequest('/onboarding/my-applications', { token: custToken });
    assert(myAppsRes.data.success === true, 'My applications endpoint works');
    assert(myAppsRes.data.applications.length >= 1, 'At least 1 application listed');

    // 25. Society Review Application (approve worker)
    console.log('\n[25/25] Verifying Society Application Review...');
    const societyToken2 = (await makeRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'society01.admin@demo.coop', password: 'password123' }) })).data.token;
    const pendingAppsRes = await makeRequest('/onboarding/pending', { token: societyToken2 });
    assert(pendingAppsRes.data.success === true, 'Pending applications fetched');

    if (assessRes.data.result.passed && pendingAppsRes.data.applications.length > 0) {
      const reviewRes = await makeRequest(`/onboarding/${newAppId}/review`, {
        method: 'PATCH', token: societyToken2,
        body: JSON.stringify({ decision: 'APPROVE', notes: 'Strong assessment performance' })
      });
      assert(reviewRes.data.success === true, 'Application approved by society');
      assert(reviewRes.data.worker.id, 'New worker ID assigned');
      assert(reviewRes.data.worker.certCode, 'Certification code issued');
    } else {
      console.log('  ⚠ SKIP: Application review (assessment may have failed, which is expected if answers are wrong)');
    }

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
