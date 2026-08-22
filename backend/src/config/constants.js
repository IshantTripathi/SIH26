export const ROLES = {
  CUSTOMER: 'customer',
  WORKER: 'worker',
  SOCIETY_ADMIN: 'society_admin',
  FEDERATION_ADMIN: 'federation_admin',
  PLATFORM_ADMIN: 'platform_admin'
};

export const JOB_STATUSES = {
  REQUESTED: 'REQUESTED',
  MATCHING: 'MATCHING',
  OFFERED: 'OFFERED',
  ACCEPTED: 'ACCEPTED',
  ON_THE_WAY: 'ON_THE_WAY',
  ARRIVED: 'ARRIVED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED'
};

export const WORKLOAD_STATUS = {
  UNDERUTILIZED: 'Underutilized',
  BALANCED: 'Balanced',
  HIGH_WORKLOAD: 'High Workload'
};

export const VERIFICATION_STATUS = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under Review',
  VERIFIED: 'Verified',
  SUSPENDED: 'Suspended'
};

export const URGENCY_LEVELS = {
  NORMAL: 'Normal',
  HIGH: 'High',
  EMERGENCY: 'Emergency'
};

export const COMPLAINT_STATUS = {
  CREATED: 'Created',
  SOCIETY_REVIEW: 'Society Review',
  INVESTIGATION: 'Investigation',
  RESOLUTION: 'Resolution',
  CLOSED: 'Closed'
};

export const CUSTOMER_TYPES = {
  HOUSEHOLD: 'Household',
  INSTITUTION: 'Institution'
};

export const INSTITUTION_TYPES = [
  'School / Educational Institute',
  'Clinic / Healthcare Facility',
  'Community Centre / Hall',
  'Office / Commercial Facility',
  'Cooperative Facility',
  'Other'
];

// Configurable Cooperative Contribution Parameters (Not Statutory)
export const DEFAULT_COOP_CONFIG = {
  COOP_COMMISSION_PERCENT: 4.0, // Configurable: Cooperative Society administration & tooling
  WELFARE_FUND_PERCENT: 1.0,    // Configurable: Allocated into Labour Welfare & Accidental Fund
  WORKER_PAYOUT_PERCENT: 95.0,  // Configurable: Transparent direct worker net wage
  DISCLAIMER: 'Demo contribution model — values are configurable by cooperative administrators and are not presented as statutory rates.'
};

export const JWT_SECRET = process.env.JWT_SECRET || 'cooperative-sih89-demo-secret-key-2026';
