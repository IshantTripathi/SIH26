const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('coop_token');
  const demoUserId = localStorage.getItem('coop_demo_user_id');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(demoUserId && { 'x-demo-user-id': demoUserId }),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`[API Client Error] on ${endpoint}:`, error.message);
    throw error;
  }
}

export const api = {
  // Auth & Demo
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email: credentials.identifier || credentials.email, password: credentials.password }) }),
  googleLogin: (token) => request('/auth/google', { method: 'POST', body: JSON.stringify({ token }) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getProfile: () => request('/auth/profile'),
  getDemoAccounts: () => request('/auth/demo-accounts'),
  resetDemoData: () => request('/auth/reset-demo', { method: 'POST' }),

  // Jobs
  createJobRequest: (jobData) => request('/jobs', { method: 'POST', body: JSON.stringify(jobData) }),
  createJob: (jobData) => request('/jobs', { method: 'POST', body: JSON.stringify(jobData) }),
  getJobs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/jobs${query ? `?${query}` : ''}`);
  },
  getJobById: (id) => request(`/jobs/${id}`),
  updateJobStatus: (id, payload) => request(`/jobs/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getJobWorkerLocation: (id) => request(`/jobs/${id}/location`),
  updateWorkerLocation: (id, lat, lng) => request(`/jobs/${id}/location`, { method: 'POST', body: JSON.stringify({ lat, lng }) }),
  processPayment: (id, payload) => request(`/jobs/${id}/payment`, { method: 'POST', body: JSON.stringify(payload) }),
  submitRating: (id, payload) => request(`/jobs/${id}/rate`, { method: 'POST', body: JSON.stringify(payload) }),
  cancelJob: (id, payload = {}) => request(`/jobs/${id}/cancel`, { method: 'POST', body: JSON.stringify(payload) }),
  declineJobOffer: (id, payload = {}) => request(`/jobs/${id}/decline`, { method: 'POST', body: JSON.stringify(payload) }),
  resendOtp: (id) => request(`/jobs/${id}/resend-otp`, { method: 'POST' }),
  rescheduleJob: (id, payload) => request(`/jobs/${id}/reschedule`, { method: 'POST', body: JSON.stringify(payload) }),
  requestReService: (id) => request(`/jobs/${id}/re-service`, { method: 'POST' }),
  sendSosAlert: (id, payload) => request(`/jobs/${id}/sos`, { method: 'POST', body: JSON.stringify(payload) }),
  getJobEta: (id) => request(`/jobs/${id}/eta`),
  getPackCredits: () => request('/jobs/packs/credits'),
  purchasePack: (payload = {}) => request('/jobs/packs/purchase', { method: 'POST', body: JSON.stringify(payload) }),

  // Allocation & Problem Classifier
  simulateAllocation: (params) => request('/allocation/simulate', { method: 'POST', body: JSON.stringify(params) }),
  classifyIntent: (problemText) => request('/allocation/classify-intent', { method: 'POST', body: JSON.stringify({ problemText }) }),
  getFivePlumberScenario: () => request('/allocation/five-plumber-scenario'),
  explainAllocation: (payload) => request('/allocation/explain', { method: 'POST', body: JSON.stringify(payload) }),
  verifyCert: (code) => request(`/allocation/verify-cert/${code}`),

  // Worker
  getWorkerProfile: (id) => request(id ? `/worker/profile/${id}` : '/worker/profile'),
  updateWorkerStatus: (payload) => request('/worker/status', { method: 'PATCH', body: JSON.stringify(payload) }),
  getWorkerEarnings: (id) => request(id ? `/worker/earnings/${id}` : '/worker/earnings'),
  updateWorkerLocation: (payload) => request('/worker/location', { method: 'PATCH', body: JSON.stringify(payload) }),
  getWorkerLocation: (workerId) => request(`/worker/location/${workerId}`),

  // Society Admin
  getSocietyDashboard: (id) => request(id ? `/society/dashboard/${id}` : '/society/dashboard'),
  verifyWorkerSkill: (workerId, payload) => request(`/society/workers/${workerId}/verify`, { method: 'PATCH', body: JSON.stringify(payload) }),
  updateSocietyConfig: (id, payload) => request(`/society/config/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Federation Admin
  getFederationDashboard: (id) => request(id ? `/federation/dashboard/${id}` : '/federation/dashboard'),
  mobilizeWorkforce: (payload) => request('/federation/mobilize', { method: 'POST', body: JSON.stringify(payload) }),
  getNotifications: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/federation/notifications${query ? `?${query}` : ''}`);
  },
  getDividendPool: () => request('/federation/dividend'),
  distributeDividend: () => request('/federation/dividend/distribute', { method: 'POST' }),
  getProposals: () => request('/federation/proposals'),
  createProposal: (payload) => request('/federation/proposals', { method: 'POST', body: JSON.stringify(payload) }),
  voteProposal: (id, vote) => request(`/federation/proposals/${id}/vote`, { method: 'POST', body: JSON.stringify({ vote }) }),
  getToolInventory: () => request('/federation/tools'),
  borrowTool: (payload) => request('/federation/tools/borrow', { method: 'POST', body: JSON.stringify(payload) }),
  returnTool: (id) => request(`/federation/tools/return/${id}`, { method: 'POST' }),

  // Analytics & Demand Forecasting
  getDemandAnalytics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/analytics/demand${query ? `?${query}` : ''}`);
  },

  // Welfare & Insurance
  getWelfareRecords: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/welfare${query ? `?${query}` : ''}`);
  },
  getMyWelfare: () => request('/welfare/my-welfare'),
  submitWelfareClaim: (payload) => request('/welfare/claim', { method: 'POST', body: JSON.stringify(payload) }),
  getWelfareClaims: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/welfare/claims${query ? `?${query}` : ''}`);
  },
  updateWelfareClaimStatus: (id, payload) => request(`/welfare/claims/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Complaints
  getComplaints: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/complaints${query ? `?${query}` : ''}`);
  },
  createComplaint: (payload) => request('/complaints', { method: 'POST', body: JSON.stringify(payload) }),
  updateComplaintStatus: (id, payload) => request(`/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // System & Audits
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/system/logs${query ? `?${query}` : ''}`);
  },
  getServices: () => request('/system/services'),
  getWorkers: (category) => request(`/system/workers${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  addService: (payload) => request('/system/services', { method: 'POST', body: JSON.stringify(payload) }),

  // Loyalty & Tier System
  getLoyaltyStatus: () => request('/loyalty'),

  // Coupons
  getCoupons: () => request('/coupons'),
  applyCoupon: (payload) => request('/coupons/apply', { method: 'POST', body: JSON.stringify(payload) }),

  // Warranty
  getWarranties: () => request('/warranties'),
  createWarranty: (payload) => request('/warranties', { method: 'POST', body: JSON.stringify(payload) }),
  claimWarranty: (id, payload) => request(`/warranties/${id}/claim`, { method: 'POST', body: JSON.stringify(payload) }),

  // Callbacks
  scheduleCallback: (payload) => request('/callbacks', { method: 'POST', body: JSON.stringify(payload) }),

  // Seasonal Suggestions
  getSeasonalSuggestions: () => request('/seasonal'),

  // Effort-Based Pricing Calculator
  calculateEffortPrice: (payload) => request('/pricing/calculate', { method: 'POST', body: JSON.stringify(payload) }),
  getTradeDefaults: () => request('/pricing/trade-defaults'),

  // Trust & Rating System
  getWorkerTrustScore: (id) => request(`/trust/worker/${id}`),
  getCustomerTrustScore: (id) => request(`/trust/customer/${id}`),
  getTrustBadge: (score) => request(`/trust/badge/${score}`),

  // AI Skill-to-Job Matching
  matchWorkers: (payload) => request('/matching/match', { method: 'POST', body: JSON.stringify(payload) }),
  explainMatch: (payload) => request('/matching/explain', { method: 'POST', body: JSON.stringify(payload) }),

  // Workload Balancing
  analyzeWorkload: (societyId) => request(`/workload/analyze/${societyId}`),
  redistributeWorkload: () => request('/workload/redistribute', { method: 'POST' }),
  getWorkloadHeatmap: () => request('/workload/heatmap'),

  // Cooperative Governance
  createGovernanceMeeting: (payload) => request('/governance/meetings', { method: 'POST', body: JSON.stringify(payload) }),
  getGovernanceMeetings: () => request('/governance/meetings'),
  recordMeetingAttendance: (id, payload) => request(`/governance/meetings/${id}/attendance`, { method: 'POST', body: JSON.stringify(payload) }),
  updateMeetingMinutes: (id, payload) => request(`/governance/meetings/${id}/minutes`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getGovernanceBylaws: () => request('/governance/bylaws'),
  createGovernanceBylaw: (payload) => request('/governance/bylaws', { method: 'POST', body: JSON.stringify(payload) }),
  createGovernanceResolution: (payload) => request('/governance/resolutions', { method: 'POST', body: JSON.stringify(payload) }),
  getGovernanceResolutions: () => request('/governance/resolutions'),
  voteGovernanceResolution: (id, vote) => request(`/governance/resolutions/${id}/vote`, { method: 'POST', body: JSON.stringify({ vote }) }),
  getGovernanceParticipation: () => request('/governance/participation'),

  // Emergency Queue
  broadcastEmergency: (payload) => request('/emergency/broadcast', { method: 'POST', body: JSON.stringify(payload) }),
  acceptEmergency: (id) => request(`/emergency/${id}/accept`, { method: 'POST' }),
  getEmergencyPool: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/emergency/pool${query ? `?${query}` : ''}`);
  },
  getActiveEmergencies: () => request('/emergency/active'),

  // Worker Onboarding & Assessment
  submitApplication: (payload) => request('/onboarding/apply', { method: 'POST', body: JSON.stringify(payload) }),
  getAssessmentQuestions: (trade) => request(`/onboarding/assessment/${encodeURIComponent(trade)}`),
  submitAssessment: (payload) => request('/onboarding/assessment/submit', { method: 'POST', body: JSON.stringify(payload) }),
  getPendingApplications: (societyId) => request(societyId ? `/onboarding/pending/${societyId}` : '/onboarding/pending'),
  reviewApplication: (id, payload) => request(`/onboarding/${id}/review`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getMyApplications: () => request('/onboarding/my-applications'),

  // Innovation 1: Voice-First Conversational Booking
  startVoiceBooking: () => request('/voice/start', { method: 'POST' }),
  sendVoiceInput: (sessionId, text) => request('/voice/input', { method: 'POST', body: JSON.stringify({ sessionId, text }) }),
  getVoiceSession: (sessionId) => request(`/voice/session/${sessionId}`),

  // Innovation 2: Worker Digital Skill Passport
  getWorkerPassport: (workerId) => request(`/passport/worker/${workerId}`),
  verifyPassport: (workerId, hash) => request(`/passport/verify/${workerId}/${hash}`),
  endorseWorker: (payload) => request('/passport/endorse', { method: 'POST', body: JSON.stringify(payload) }),
  getPassportStats: () => request('/passport/stats'),

  // Innovation 3: Predictive Maintenance Alerts
  getMaintenanceAlerts: (customerId) => request(`/predictive/alerts/${customerId}`),
  getMaintenanceStats: (customerId) => request(`/predictive/stats/${customerId}`),

  // Innovation 4: Community Impact Dashboard
  getCommunityImpact: () => request('/impact'),

  // Innovation 5: Smart Scheduling
  getScheduleSuggestions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/scheduling/suggestions${query ? `?${query}` : ''}`);
  },
  getSeasonalForecast: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/scheduling/forecast${query ? `?${query}` : ''}`);
  },

  // Innovation 6: Worker Wellness
  getWorkerWellness: (workerId) => request(`/wellness/worker/${workerId}`),
  getMyWellness: () => request('/wellness/my-wellness'),
  getWellnessAlerts: (societyId) => request(`/wellness/alerts/${societyId}`),

  // Innovation 7: Dividend Calculator
  getWorkerDividend: (workerId) => request(`/dividend/worker/${workerId}`),
  getMyDividend: () => request('/dividend/my-dividend'),
  getCooperativeSurplus: () => request('/dividend/surplus'),

  // Innovation 8: AR Repair Guidance
  getRepairGuide: (category, issueType) => request(`/ar-guides/${encodeURIComponent(category)}${issueType ? `/${encodeURIComponent(issueType)}` : ''}`),
  getAllRepairGuides: () => request('/ar-guides'),
  getToolRecommendations: (category) => request(`/ar-tools/${encodeURIComponent(category)}`),

  // Urban Company Style: Subscription Packs & Instant Booking
  getSubscriptionPacks: (serviceCategory) => request(`/subscription/packs/${encodeURIComponent(serviceCategory)}`),
  purchaseSubscriptionPack: (payload) => request('/subscription/purchase', { method: 'POST', body: JSON.stringify(payload) }),
  getCustomerSubscriptions: (customerId) => request(`/subscription/customer/${customerId}`),
  useSubscriptionSession: (subscriptionId) => request('/subscription/use-session', { method: 'POST', body: JSON.stringify({ subscriptionId }) }),
  getInstantBookingEligibility: (serviceCategory) => request(`/subscription/instant-booking/eligibility/${encodeURIComponent(serviceCategory)}`),
  createInstantBooking: (payload) => request('/subscription/instant-booking/create', { method: 'POST', body: JSON.stringify(payload) }),
  respondToInstantBooking: (payload) => request('/subscription/instant-booking/respond', { method: 'POST', body: JSON.stringify(payload) }),
  getInstantBookingStatus: (bookingId) => request(`/subscription/instant-booking/${bookingId}`),

  // New Service Categories
  getBeautySpaServices: () => request('/system/services?category=Beauty & Spa'),
  getManicurePedicureServices: () => request('/system/services?category=Manicure & Pedicure'),
  getHousehelpServices: () => request('/system/services?category=Househelp'),

  // Gemini AI Assistant
  chatWithAi: (payload) => request('/ai/chat', { method: 'POST', body: JSON.stringify(payload) }),
  getAiSuggestions: () => request('/ai/suggestions'),
  getAiStatus: () => request('/ai/status')
};
