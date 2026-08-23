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
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
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
  processPayment: (id, payload) => request(`/jobs/${id}/payment`, { method: 'POST', body: JSON.stringify(payload) }),
  submitRating: (id, payload) => request(`/jobs/${id}/rate`, { method: 'POST', body: JSON.stringify(payload) }),
  cancelJob: (id, payload = {}) => request(`/jobs/${id}/cancel`, { method: 'POST', body: JSON.stringify(payload) }),
  declineJobOffer: (id, payload = {}) => request(`/jobs/${id}/decline`, { method: 'POST', body: JSON.stringify(payload) }),
  resendOtp: (id) => request(`/jobs/${id}/resend-otp`, { method: 'POST' }),

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
  addService: (payload) => request('/system/services', { method: 'POST', body: JSON.stringify(payload) })
};
