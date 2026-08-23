import { store } from '../data/store.js';
import { VERIFICATION_STATUS } from '../config/constants.js';
import { assessmentQuestions } from '../data/assessmentQuestions.js';

export function submitApplication(req, res) {
  try {
    const {
      fullName, mobile, email, primarySkill, secondarySkills = [],
      experienceYears, aadhaarLast4, societyId = 'SOC-DEMO-001',
      address, bankAccountLast4, upiId
    } = req.body;

    if (!fullName || !mobile || !primarySkill) {
      return res.status(400).json({ success: false, message: 'fullName, mobile, and primarySkill are required.' });
    }

    const application = store.create('workerApplications', {
      userId: req.user?.id || null,
      fullName,
      mobile,
      email: email || '',
      primarySkill,
      secondarySkills,
      experienceYears: Number(experienceYears) || 0,
      aadhaarLast4: aadhaarLast4 || 'XXXX',
      societyId,
      address: address || '',
      bankAccountLast4: bankAccountLast4 || '',
      upiId: upiId || '',
      status: 'SUBMITTED',
      assessmentCompleted: false,
      assessmentScore: null,
      verifiedAt: null,
      certCode: null
    });

    store.logAudit({
      actorName: fullName,
      actorRole: 'applicant',
      action: 'WORKER_APPLICATION_SUBMITTED',
      module: 'Onboarding',
      recordId: application.id,
      details: `New worker application from ${fullName} for ${primarySkill}. Awaiting skill assessment.`
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted. Please complete the skill assessment.',
      application
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getAssessmentQuestions(req, res) {
  try {
    const { trade } = req.params;
    const questions = assessmentQuestions.filter(q => q.trade === trade);
    if (questions.length === 0) {
      return res.status(404).json({ success: false, message: `No assessment questions found for trade: ${trade}` });
    }
    const safe = questions.map(({ correctIndex, ...rest }) => rest);
    return res.json({ success: true, trade, totalQuestions: safe.length, questions: safe });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function submitAssessment(req, res) {
  try {
    const { applicationId, trade, answers } = req.body;
    if (!applicationId || !trade || !answers) {
      return res.status(400).json({ success: false, message: 'applicationId, trade, and answers array are required.' });
    }

    const application = store.findById('workerApplications', applicationId);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });

    const questions = assessmentQuestions.filter(q => q.trade === trade);
    let correct = 0;
    let total = questions.length;

    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct++;
    });

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = score >= 60;

    const result = store.create('skillAssessments', {
      applicationId,
      trade,
      answers,
      correctAnswers: correct,
      totalQuestions: total,
      score,
      passed,
      submittedAt: new Date().toISOString()
    });

    store.findByIdAndUpdate('workerApplications', applicationId, {
      assessmentCompleted: true,
      assessmentScore: score,
      status: passed ? 'ASSESSMENT_PASSED' : 'ASSESSMENT_FAILED'
    });

    return res.json({
      success: true,
      message: passed
        ? `Assessment PASSED (${correct}/${total} = ${score}%). Application submitted for society review.`
        : `Assessment FAILED (${correct}/${total} = ${score}%). Minimum 60% required. You may re-apply after 7 days.`,
      result: {
        score,
        correct,
        total,
        passed,
        passMark: 60
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getPendingApplications(req, res) {
  try {
    const societyId = req.user?.societyId || req.params.societyId || 'SOC-DEMO-001';
    const apps = store.find('workerApplications', { societyId });
    const pending = apps.filter(a => a.status === 'ASSESSMENT_PASSED' || a.status === 'SUBMITTED');
    return res.json({
      success: true,
      count: pending.length,
      applications: pending
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function reviewApplication(req, res) {
  try {
    const { id } = req.params;
    const { decision, notes = '' } = req.body;

    const application = store.findById('workerApplications', id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (!['SUBMITTED', 'ASSESSMENT_PASSED'].includes(application.status)) {
      return res.status(400).json({ success: false, message: 'Application is not in reviewable state.' });
    }

    if (decision === 'APPROVE') {
      const workerId = `WORKER-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const certCode = `CERT-${application.primarySkill.toUpperCase().slice(0, 4)}-${Date.now()}`;

      const newWorker = store.create('workers', {
        userId: application.userId || `USR-NEW-${Date.now()}`,
        code: workerId,
        name: application.fullName,
        societyId: application.societyId,
        serviceCategories: [application.primarySkill, ...application.secondarySkills],
        primarySkill: application.primarySkill,
        secondarySkills: application.secondarySkills,
        experienceYears: application.experienceYears,
        certifications: [{
          code: certCode,
          title: `${application.primarySkill} Cooperative Certification`,
          issuedBy: 'Cooperative Skill Verification Board',
          issuedDate: new Date().toISOString().split('T')[0],
          verified: true
        }],
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
        isOnline: false,
        currentWorkload: 'Underutilized',
        activeJobsCount: 0,
        recentCompletedJobs: 0,
        ratingAvg: 0,
        ratingCount: 0,
        totalEarningsGross: 0,
        location: { lat: 28.6140 + (Math.random() - 0.5) * 0.02, lng: 77.2095 + (Math.random() - 0.5) * 0.02, area: application.address || 'Central Metro' },
        welfareId: null,
        assessmentScore: application.assessmentScore
      });

      store.findByIdAndUpdate('workerApplications', id, {
        status: 'APPROVED',
        certCode,
        newWorkerId: workerId,
        reviewedAt: new Date().toISOString(),
        reviewedBy: req.user?.name || 'Society Admin',
        reviewNotes: notes
      });

      store.logAudit({
        actorName: req.user?.name || 'Society Admin',
        actorRole: req.user?.role || 'society_admin',
        action: 'WORKER_APPLICATION_APPROVED',
        module: 'Onboarding',
        recordId: id,
        details: `Application ${id} approved. Worker ${application.fullName} created (${workerId}). Cert: ${certCode}. Score: ${application.assessmentScore}%.`
      });

      store.pushNotification({
        title: 'Application Approved',
        message: `Congratulations! Your cooperative membership has been approved. Your Worker ID is ${workerId}.`,
        targetUserId: application.userId,
        type: 'success'
      });

      return res.json({
        success: true,
        message: `Application approved! Worker ${application.fullName} is now a verified cooperative member.`,
        worker: { id: workerId, certCode }
      });
    } else {
      store.findByIdAndUpdate('workerApplications', id, {
        status: 'REJECTED',
        reviewedAt: new Date().toISOString(),
        reviewedBy: req.user?.name || 'Society Admin',
        reviewNotes: notes || 'Application does not meet requirements'
      });

      store.logAudit({
        actorName: req.user?.name || 'Society Admin',
        actorRole: req.user?.role || 'society_admin',
        action: 'WORKER_APPLICATION_REJECTED',
        module: 'Onboarding',
        recordId: id,
        details: `Application ${id} rejected. Notes: ${notes}`
      });

      return res.json({ success: true, message: 'Application rejected.' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getMyApplications(req, res) {
  try {
    const userId = req.user?.id;
    const apps = store.find('workerApplications', { userId });
    return res.json({ success: true, applications: apps });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
