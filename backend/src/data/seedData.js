import { ROLES, JOB_STATUSES, WORKLOAD_STATUS, VERIFICATION_STATUS, URGENCY_LEVELS, COMPLAINT_STATUS, CUSTOMER_TYPES } from '../config/constants.js';

export const initialFederations = [
  {
    id: 'FED-DEMO-001',
    name: 'Sample Labour Cooperative Federation (Demo)',
    code: 'FED-DEMO-001',
    state: 'Delhi NCR Region',
    districtsCovered: ['Central Metro', 'East District', 'North District', 'South Suburban'],
    contactEmail: 'federation.admin@demo.coop',
    establishedYear: 2021,
    activeSocietiesCount: 2,
    totalWorkersCovered: 12,
    status: 'Demo Environment',
    createdAt: '2025-01-01T00:00:00.000Z'
  }
];

export const initialSocieties = [
  {
    id: 'SOC-DEMO-001',
    federationId: 'FED-DEMO-001',
    name: 'Central Metro Labour Cooperative Society (Demo)',
    registrationNumber: 'SOC-REG-DEMO-01',
    district: 'Central Metro',
    coverageRadiusKm: 15,
    pincodesCovered: ['110001', '110002', '110003', '110005'],
    centerLocation: { lat: 28.6139, lng: 77.2090, area: 'Connaught Place Center' },
    coopContributionPercent: 4.0, // Configurable
    welfareFundPercent: 1.0,      // Configurable
    workerPayoutPercent: 95.0,    // Configurable
    officialEmail: 'society01.admin@demo.coop',
    totalWorkers: 12,
    activeJobsCount: 6,
    status: 'Active (Demo)',
    createdAt: '2025-01-10T00:00:00.000Z'
  },
  {
    id: 'SOC-DEMO-002',
    federationId: 'FED-DEMO-001',
    name: 'Eastern Suburban Labour Cooperative Society (Demo)',
    registrationNumber: 'SOC-REG-DEMO-02',
    district: 'East District',
    coverageRadiusKm: 20,
    pincodesCovered: ['110091', '110092', '110095'],
    centerLocation: { lat: 28.6280, lng: 77.2950, area: 'Mayur Vihar Center' },
    coopContributionPercent: 4.0,
    welfareFundPercent: 1.0,
    workerPayoutPercent: 95.0,
    officialEmail: 'society02.admin@demo.coop',
    totalWorkers: 6,
    activeJobsCount: 3,
    status: 'Active (Demo)',
    createdAt: '2025-02-01T00:00:00.000Z'
  }
];

export const initialUsers = [
  // 1. Federation Admin
  {
    id: 'USR-FED-001',
    name: 'Federation Admin 01',
    email: 'federation.admin@demo.coop',
    mobile: '9876543201',
    role: ROLES.FEDERATION_ADMIN,
    password: 'password123',
    federationId: 'FED-DEMO-001',
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'USR-FED-001B',
    name: 'Federation Admin 01',
    email: 'federation01@demo.coop',
    mobile: '9876543209',
    role: ROLES.FEDERATION_ADMIN,
    password: 'password123',
    federationId: 'FED-DEMO-001',
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  // 2. Society Admins
  {
    id: 'USR-SOC-001',
    name: 'Society Admin 01',
    email: 'society01.admin@demo.coop',
    mobile: '9876543202',
    role: ROLES.SOCIETY_ADMIN,
    password: 'password123',
    societyId: 'SOC-DEMO-001',
    createdAt: '2025-01-10T00:00:00.000Z'
  },
  {
    id: 'USR-SOC-002',
    name: 'Society Admin 02',
    email: 'society02.admin@demo.coop',
    mobile: '9876543203',
    role: ROLES.SOCIETY_ADMIN,
    password: 'password123',
    societyId: 'SOC-DEMO-002',
    createdAt: '2025-02-01T00:00:00.000Z'
  },
  // 3. Platform Admin
  {
    id: 'USR-ADM-001',
    name: 'Platform Admin 01',
    email: 'platform.admin@demo.coop',
    mobile: '9876543200',
    role: ROLES.PLATFORM_ADMIN,
    password: 'password123',
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  // 4. Customers (Household & Institution)
  {
    id: 'USR-CUST-001',
    name: 'Customer Demo 01',
    email: 'customer01@demo.coop',
    mobile: '9876500001',
    role: ROLES.CUSTOMER,
    customerType: CUSTOMER_TYPES.HOUSEHOLD,
    password: 'password123',
    address: 'B-42, Metro Residency, Connaught Place',
    location: { lat: 28.6140, lng: 77.2095, area: 'Connaught Place', city: 'Delhi' },
    createdAt: '2025-01-15T00:00:00.000Z'
  },
  {
    id: 'USR-CUST-002',
    name: 'Customer Demo 02 (Institution)',
    email: 'customer02@demo.coop',
    mobile: '9876500002',
    role: ROLES.CUSTOMER,
    customerType: CUSTOMER_TYPES.INSTITUTION,
    institutionName: 'Community Health Centre (Demo)',
    institutionType: 'Clinic / Healthcare Facility',
    contactPerson: 'Administrative Officer 01',
    password: 'password123',
    address: 'Block C, Mayur Vihar Phase 1',
    location: { lat: 28.6290, lng: 77.2940, area: 'Mayur Vihar', city: 'Delhi' },
    createdAt: '2025-01-20T00:00:00.000Z'
  },
  {
    id: 'USR-CUST-002B',
    name: 'Institution Demo 01',
    email: 'institution01@demo.coop',
    mobile: '9876500004',
    role: ROLES.CUSTOMER,
    customerType: CUSTOMER_TYPES.INSTITUTION,
    institutionName: 'Jan Kalyan Cooperative Health Centre (Demo)',
    institutionType: 'Clinic / Healthcare Facility',
    contactPerson: 'Facility Coordinator 01',
    password: 'password123',
    address: 'Block C, Mayur Vihar Phase 1',
    location: { lat: 28.6290, lng: 77.2940, area: 'Mayur Vihar', city: 'Delhi' },
    createdAt: '2025-01-20T00:00:00.000Z'
  },
  {
    id: 'USR-CUST-003',
    name: 'Customer Demo 03 (School)',
    email: 'customer03@demo.coop',
    mobile: '9876500003',
    role: ROLES.CUSTOMER,
    customerType: CUSTOMER_TYPES.INSTITUTION,
    institutionName: 'Primary Model School (Demo)',
    institutionType: 'School / Educational Institute',
    contactPerson: 'Facility Coordinator 01',
    password: 'password123',
    address: 'Sector 4, Central Metro',
    location: { lat: 28.6180, lng: 77.2120, area: 'Central Metro', city: 'Delhi' },
    createdAt: '2025-01-25T00:00:00.000Z'
  },
  // 5. Worker Users
  {
    id: 'USR-WRK-001',
    name: 'Worker Demo 01 (Worker B - Low Workload)',
    email: 'worker01@demo.coop',
    mobile: '9876510001',
    role: ROLES.WORKER,
    password: 'password123',
    workerId: 'WORKER-DEMO-001',
    createdAt: '2025-01-12T00:00:00.000Z'
  },
  {
    id: 'USR-WRK-002',
    name: 'Worker Demo 02 (Worker A - High Workload)',
    email: 'worker02@demo.coop',
    mobile: '9876510002',
    role: ROLES.WORKER,
    password: 'password123',
    workerId: 'WORKER-DEMO-002',
    createdAt: '2025-01-12T00:00:00.000Z'
  },
  {
    id: 'USR-WRK-003',
    name: 'Worker Demo 03 (Worker C - Unavailable)',
    email: 'worker03@demo.coop',
    mobile: '9876510003',
    role: ROLES.WORKER,
    password: 'password123',
    workerId: 'WORKER-DEMO-003',
    createdAt: '2025-01-12T00:00:00.000Z'
  },
  {
    id: 'USR-WRK-004',
    name: 'Worker Demo 04 (Worker D - 0 Jobs)',
    email: 'worker04@demo.coop',
    mobile: '9876510004',
    role: ROLES.WORKER,
    password: 'password123',
    workerId: 'WORKER-DEMO-004',
    createdAt: '2025-01-12T00:00:00.000Z'
  },
  {
    id: 'USR-WRK-005',
    name: 'Worker Demo 05 (Worker E - 3 Jobs)',
    email: 'worker05@demo.coop',
    mobile: '9876510005',
    role: ROLES.WORKER,
    password: 'password123',
    workerId: 'WORKER-DEMO-005',
    createdAt: '2025-01-12T00:00:00.000Z'
  },
  // NEW URBAN COMPANY STYLE WORKERS - Househelp, Beauty/Spa, Manicure/Pedicure
  {
    id: 'USR-WRK-010',
    name: 'Ritu Sharma (Househelp Specialist)',
    email: 'worker10@demo.coop',
    mobile: '9876510010',
    role: ROLES.WORKER,
    password: 'password123',
    workerId: 'WORKER-DEMO-010',
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: 'USR-WRK-011',
    name: 'Priya Verma (Househelp)',
    email: 'worker11@demo.coop',
    mobile: '9876510011',
    role: ROLES.WORKER,
    password: 'password123',
    workerId: 'WORKER-DEMO-011',
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: 'USR-WRK-012',
    name: 'Anita Kumari (Beauty Expert)',
    email: 'worker12@demo.coop',
    mobile: '9876510012',
    role: ROLES.WORKER,
    password: 'password123',
    workerId: 'WORKER-DEMO-012',
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: 'USR-WRK-013',
    name: 'Sunita Devi (Spa Therapist)',
    email: 'worker13@demo.coop',
    mobile: '9876510013',
    role: ROLES.WORKER,
    password: 'password123',
    workerId: 'WORKER-DEMO-013',
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: 'USR-WRK-014',
    name: 'Kavita Joshi (Nail Artist)',
    email: 'worker14@demo.coop',
    mobile: '9876510014',
    role: ROLES.WORKER,
    password: 'password123',
    workerId: 'WORKER-DEMO-014',
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: 'USR-WRK-015',
    name: 'Deepa Nair (Househelp)',
    email: 'worker15@demo.coop',
    mobile: '9876510015',
    role: ROLES.WORKER,
    password: 'password123',
    workerId: 'WORKER-DEMO-015',
    createdAt: '2025-06-01T00:00:00.000Z'
  }
];

export const initialServices = [
  {
    id: 'SERV-PLUMBING',
    category: 'Plumbing',
    title: 'Plumbing & Sanitary Maintenance',
    description: 'Leak detection, tap repair, pipe replacement, drainage unclogging, and sanitary fittings.',
    basePrice: 450,
    priceUnit: 'per visit / standard fix',
    estimatedDurationMin: 45,
    requiredCertifications: ['CERT-DEMO-PLUMB'],
    keywords: ['tap', 'pipe', 'leak', 'water', 'drain', 'basin', 'sink', 'toilet', 'flush', 'geyser', 'plumber', 'overflow', 'faucet']
  },
  {
    id: 'SERV-ELECTRICAL',
    category: 'Electrical',
    title: 'Electrical & Wiring Services',
    description: 'Switchboard fixing, MCB maintenance, wiring inspection, fan installation, and short-circuit diagnosis.',
    basePrice: 400,
    priceUnit: 'per visit / service item',
    estimatedDurationMin: 40,
    requiredCertifications: ['CERT-DEMO-ELEC'],
    keywords: ['fan', 'light', 'wire', 'switch', 'spark', 'current', 'mcb', 'fuse', 'socket', 'bulb', 'electrician', 'tripping', 'power']
  },
  {
    id: 'SERV-APPLIANCE',
    category: 'Appliance Repair',
    title: 'Home Appliance Diagnosis & Repair',
    description: 'Refrigerators, washing machines, microwaves, and domestic appliance troubleshooting.',
    basePrice: 550,
    priceUnit: 'per appliance diagnostic',
    estimatedDurationMin: 60,
    requiredCertifications: ['CERT-DEMO-APPL'],
    keywords: ['refrigerator', 'fridge', 'washing machine', 'microwave', 'oven', 'cooler', 'ac', 'grinder', 'mixer', 'appliance', 'motor']
  },
  {
    id: 'SERV-CARPENTRY',
    category: 'Carpentry',
    title: 'Carpentry & Woodwork Solutions',
    description: 'Door hinge fixes, furniture assembly, wooden locks, modular repairs, and custom fitting.',
    basePrice: 500,
    priceUnit: 'per service call',
    estimatedDurationMin: 60,
    requiredCertifications: ['CERT-DEMO-CARP'],
    keywords: ['door', 'window', 'cupboard', 'table', 'chair', 'furniture', 'wood', 'hinge', 'lock', 'drawer', 'carpenter', 'shelf']
  },
  {
    id: 'SERV-PAINTING',
    category: 'Painting',
    title: 'Painting & Wall Touchup',
    description: 'Waterproofing touchup, interior wall coating, door varnishing, and patch painting.',
    basePrice: 700,
    priceUnit: 'per wall unit / touchup',
    estimatedDurationMin: 120,
    requiredCertifications: ['CERT-DEMO-PAINT'],
    keywords: ['paint', 'color', 'wall', 'damp', 'seepage', 'brush', 'coat', 'varnish', 'stain', 'primer', 'painter']
  },
  {
    id: 'SERV-CLEANING',
    category: 'Cleaning',
    title: 'Deep Household & Floor Cleaning',
    description: 'Intense kitchen, washroom, floor scrubbing, and institutional disinfection services.',
    basePrice: 600,
    priceUnit: 'per standard room / zone',
    estimatedDurationMin: 90,
    requiredCertifications: ['CERT-DEMO-CLEAN'],
    keywords: ['clean', 'dust', 'washroom', 'kitchen', 'floor', 'scrub', 'sanitize', 'sweep', 'mop', 'trash', 'deep clean']
  },
  {
    id: 'SERV-GARDENING',
    category: 'Gardening',
    title: 'Gardening & Lawn Maintenance',
    description: 'Pruning shrubs, lawn mowing, weeding, organic fertilizer application, and plant potting.',
    basePrice: 450,
    priceUnit: 'per garden visit',
    estimatedDurationMin: 60,
    requiredCertifications: ['CERT-DEMO-GARD'],
    keywords: ['garden', 'lawn', 'plant', 'grass', 'pot', 'prune', 'tree', 'bush', 'flower', 'gardener', 'leaf', 'weeding']
  },
  {
    id: 'SERV-DRIVING',
    category: 'Driving',
    title: 'Verified Chauffeur & Driver Support',
    description: 'Daily, outstation, or emergency chauffeur services by verified cooperative drivers.',
    basePrice: 650,
    priceUnit: 'per 4-hour slot',
    estimatedDurationMin: 240,
    requiredCertifications: ['CERT-DEMO-DRIVE'],
    keywords: ['driver', 'car', 'drive', 'chauffeur', 'cab', 'vehicle', 'transport', 'drop', 'pickup']
  },
  {
    id: 'SERV-CAREGIVING',
    category: 'Caregiving',
    title: 'Elderly & Patient Caregiving Assistance',
    description: 'Compassionate assistance for mobility, medication reminders, companionship, and daily aid.',
    basePrice: 800,
    priceUnit: 'per half-day shift',
    estimatedDurationMin: 240,
    requiredCertifications: ['CERT-DEMO-CARE'],
    keywords: ['elderly', 'patient', 'caregiver', 'nurse', 'attendant', 'medicine', 'senior', 'bedridden', 'care', 'support']
  },
  {
    id: 'SERV-MAINTENANCE',
    category: 'General Maintenance',
    title: 'General Handyman & Facility Support',
    description: 'Multi-skilled handyman support for minor repairs, fixtures, drillings, and upkeep.',
    basePrice: 400,
    priceUnit: 'per hour',
    estimatedDurationMin: 60,
    requiredCertifications: ['CERT-DEMO-MAINT'],
    keywords: ['handyman', 'drill', 'curtain', 'fixture', 'mounting', 'repair', 'maintenance', 'fix', 'general']
  },
  {
    id: 'SERV-HOUSEHELP',
    category: 'Househelp',
    title: 'Instant Househelp & Domestic Help',
    description: 'Cooking, cleaning, dishwashing, laundry, grocery shopping, and daily household chores. Instant booking available within 30 minutes.',
    basePrice: 350,
    priceUnit: 'per hour',
    estimatedDurationMin: 120,
    requiredCertifications: ['CERT-DEMO-HOUSE'],
    keywords: ['househelp', 'maid', 'cooking', 'cleaning', 'dishes', 'laundry', 'grocery', 'domestic', 'help', 'kitchen', 'utensil', 'sweep', 'mop', 'iron'],
    instantBookingAvailable: true,
    subscriptionPacks: [
      { id: 'PACK-WEEKLY-12H', name: 'Weekly Basic', hoursPerWeek: 12, price: 3500, pricePerHour: 292, description: '12 hours/week for basic household chores' },
      { id: 'PACK-WEEKLY-24H', name: 'Weekly Premium', hoursPerWeek: 24, price: 6000, pricePerHour: 250, description: '24 hours/week including cooking and deep cleaning' },
      { id: 'PACK-MONTHLY-48H', name: 'Monthly Basic', hoursPerMonth: 48, price: 12000, pricePerHour: 250, description: '48 hours/month for regular household maintenance' },
      { id: 'PACK-MONTHLY-96H', name: 'Monthly Premium', hoursPerMonth: 96, price: 21000, pricePerHour: 219, description: '96 hours/month full household management' }
    ],
    recurringBookingOptions: ['Daily', 'Alternate Days', 'Weekly', 'Monthly']
  },
  {
    id: 'SERV-BEAUTY-SPA',
    category: 'Beauty & Spa',
    title: 'Beauty Treatment & Spa Services',
    description: 'Professional beauty treatments, facial, body massage, hair spa, skin care, and relaxation therapies at home.',
    basePrice: 800,
    priceUnit: 'per session',
    estimatedDurationMin: 90,
    requiredCertifications: ['CERT-DEMO-BEAUTY'],
    keywords: ['beauty', 'spa', 'facial', 'massage', 'hair', 'skin', 'relaxation', 'body', 'therapy', 'aroma', 'hot stone', 'head massage'],
    subServices: [
      { id: 'SUB-FACIAL', name: 'Facial Treatment', price: 800, duration: 60 },
      { id: 'SUB-BODY-MASSAGE', name: 'Body Massage', price: 1200, duration: 90 },
      { id: 'SUB-HAIR-SPA', name: 'Hair Spa Treatment', price: 600, duration: 45 },
      { id: 'SUB-AROMA', name: 'Aromatherapy Session', price: 1500, duration: 90 },
      { id: 'SUB-HOT-STONE', name: 'Hot Stone Massage', price: 1800, duration: 90 },
      { id: 'SUB-HEAD-MASSAGE', name: 'Head Massage', price: 400, duration: 30 }
    ]
  },
  {
    id: 'SERV-MANICURE-PEDICURE',
    category: 'Manicure & Pedicure',
    title: 'Professional Manicure & Pedicure',
    description: 'Nail care, cuticle treatment, nail art, gel polish, foot spa, and paraffin wax treatment at home.',
    basePrice: 500,
    priceUnit: 'per session',
    estimatedDurationMin: 60,
    requiredCertifications: ['CERT-DEMO-NAILS'],
    keywords: ['manicure', 'pedicure', 'nail', 'cuticle', 'polish', 'gel', 'nail art', 'foot spa', 'paraffin', 'hand care', 'foot care'],
    subServices: [
      { id: 'SUB-BASIC-MANICURE', name: 'Basic Manicure', price: 350, duration: 30 },
      { id: 'SUB-BASIC-PEDICURE', name: 'Basic Pedicure', price: 400, duration: 35 },
      { id: 'SUB-GEL-MANICURE', name: 'Gel Manicure', price: 600, duration: 45 },
      { id: 'SUB-GEL-PEDICURE', name: 'Gel Pedicure', price: 700, duration: 50 },
      { id: 'SUB-NAIL-ART', name: 'Nail Art Design', price: 300, duration: 30 },
      { id: 'SUB-FULL-SET', name: 'Full Manicure + Pedicure', price: 800, duration: 75 },
      { id: 'SUB-PARAFFIN', name: 'Paraffin Wax Treatment', price: 500, duration: 30 },
      { id: 'SUB-FOOT-SPA', name: 'Foot Spa & Massage', price: 450, duration: 40 }
    ]
  }
];

export const initialWorkers = [
  // 5 Plumbers for Fair Allocation Scenario 2
  {
    id: 'WORKER-DEMO-001',
    userId: 'USR-WRK-001',
    code: 'WORKER-DEMO-001',
    name: 'Worker Demo 01 (Worker B)',
    societyId: 'SOC-DEMO-001',
    serviceCategories: ['Plumbing', 'General Maintenance'],
    primarySkill: 'Plumbing',
    secondarySkills: ['General Maintenance', 'Sanitary Fittings'],
    experienceYears: 4,
    certifications: [
      {
        code: 'CERT-DEMO-002',
        title: 'Sample Certified Domestic Plumber Badge',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2024-03-10',
        verified: true
      }
    ],
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    isOnline: true,
    currentWorkload: WORKLOAD_STATUS.BALANCED,
    activeJobsCount: 2,
    recentCompletedJobs: 2,
    ratingAvg: 4.85,
    ratingCount: 28,
    totalEarningsGross: 14200,
    location: { lat: 28.6160, lng: 77.2150, area: 'Connaught Place East' }, // 1.4 km from Customer Demo 01
    distanceToCustomerKm: 1.4,
    welfareId: 'WELFARE-DEMO-001',
    insuranceId: 'INS-DEMO-001',
    serviceAreas: ['Connaught Place', 'Barakhamba', 'Pahar Ganj'],
    reliabilityScore: 94
  },
  {
    id: 'WORKER-DEMO-002',
    userId: 'USR-WRK-002',
    code: 'WORKER-DEMO-002',
    name: 'Worker Demo 02 (Worker A)',
    societyId: 'SOC-DEMO-001',
    serviceCategories: ['Plumbing'],
    primarySkill: 'Plumbing',
    secondarySkills: ['Leakage Sealing'],
    experienceYears: 6,
    certifications: [
      {
        code: 'CERT-DEMO-001',
        title: 'Sample Master Plumbing Certificate',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2023-08-15',
        verified: true
      }
    ],
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    isOnline: true,
    currentWorkload: WORKLOAD_STATUS.HIGH_WORKLOAD,
    activeJobsCount: 8,
    recentCompletedJobs: 8,
    ratingAvg: 4.90,
    ratingCount: 74,
    totalEarningsGross: 42800,
    location: { lat: 28.6145, lng: 77.2110, area: 'Janpath Lane' }, // 1.0 km (Nearest, but heavily loaded)
    distanceToCustomerKm: 1.0,
    welfareId: 'WELFARE-DEMO-002',
    insuranceId: 'INS-DEMO-002',
    serviceAreas: ['Connaught Place', 'Janpath'],
    reliabilityScore: 96
  },
  {
    id: 'WORKER-DEMO-003',
    userId: 'USR-WRK-003',
    code: 'WORKER-DEMO-003',
    name: 'Worker Demo 03 (Worker C)',
    societyId: 'SOC-DEMO-001',
    serviceCategories: ['Plumbing'],
    primarySkill: 'Plumbing',
    secondarySkills: ['Drainage Cleaning'],
    experienceYears: 3,
    certifications: [
      {
        code: 'CERT-DEMO-003',
        title: 'Sample Trade Badge',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2024-06-20',
        verified: true
      }
    ],
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    isOnline: false, // UNAVAILABLE / OFFLINE
    currentWorkload: WORKLOAD_STATUS.BALANCED,
    activeJobsCount: 5,
    recentCompletedJobs: 5,
    ratingAvg: 4.70,
    ratingCount: 19,
    totalEarningsGross: 11000,
    location: { lat: 28.6130, lng: 77.2080, area: 'Sansad Marg' }, // 0.8 km (Nearest, but OFFLINE)
    distanceToCustomerKm: 0.8,
    welfareId: 'WELFARE-DEMO-003',
    insuranceId: 'INS-DEMO-003',
    serviceAreas: ['Central Metro'],
    reliabilityScore: 88
  },
  {
    id: 'WORKER-DEMO-004',
    userId: 'USR-WRK-004',
    code: 'WORKER-DEMO-004',
    name: 'Worker Demo 04 (Worker D)',
    societyId: 'SOC-DEMO-001',
    serviceCategories: ['Plumbing', 'General Maintenance'],
    primarySkill: 'Plumbing',
    secondarySkills: ['Appliance Repair'],
    experienceYears: 2,
    certifications: [
      {
        code: 'CERT-DEMO-004',
        title: 'Sample Vocational Certificate',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2024-11-01',
        verified: true
      }
    ],
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    isOnline: true,
    currentWorkload: WORKLOAD_STATUS.UNDERUTILIZED,
    activeJobsCount: 0,
    recentCompletedJobs: 0,
    ratingAvg: 4.50,
    ratingCount: 4,
    totalEarningsGross: 2100,
    location: { lat: 28.6250, lng: 77.2250, area: 'Mandi House' }, // 2.5 km
    distanceToCustomerKm: 2.5,
    welfareId: 'WELFARE-DEMO-004',
    insuranceId: 'INS-DEMO-004',
    serviceAreas: ['Central Metro', 'East Gate'],
    reliabilityScore: 90
  },
  {
    id: 'WORKER-DEMO-005',
    userId: 'USR-WRK-005',
    code: 'WORKER-DEMO-005',
    name: 'Worker Demo 05 (Worker E)',
    societyId: 'SOC-DEMO-001',
    serviceCategories: ['Plumbing'],
    primarySkill: 'Plumbing',
    secondarySkills: ['Pipe Line Assembly'],
    experienceYears: 5,
    certifications: [
      {
        code: 'CERT-DEMO-005',
        title: 'Sample Advanced Plumbing Certificate',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2023-10-10',
        verified: true
      }
    ],
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    isOnline: true,
    currentWorkload: WORKLOAD_STATUS.BALANCED,
    activeJobsCount: 3,
    recentCompletedJobs: 3,
    ratingAvg: 4.80,
    ratingCount: 35,
    totalEarningsGross: 18500,
    location: { lat: 28.6200, lng: 77.2200, area: 'Barakhamba Road' }, // 1.9 km
    distanceToCustomerKm: 1.9,
    welfareId: 'WELFARE-DEMO-005',
    insuranceId: 'INS-DEMO-005',
    serviceAreas: ['Connaught Place', 'Barakhamba'],
    reliabilityScore: 92
  },

  // Additional trade workers
  {
    id: 'WORKER-DEMO-006',
    userId: 'USR-WRK-006',
    code: 'WORKER-DEMO-006',
    name: 'Worker Demo 06 (Electrician)',
    societyId: 'SOC-DEMO-001',
    serviceCategories: ['Electrical', 'Appliance Repair'],
    primarySkill: 'Electrical',
    secondarySkills: ['Appliance Repair', 'Circuit Diagnostics'],
    experienceYears: 7,
    certifications: [
      {
        code: 'CERT-DEMO-ELEC-01',
        title: 'Sample Certified Wireman Certificate',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2023-04-12',
        verified: true
      }
    ],
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    isOnline: true,
    currentWorkload: WORKLOAD_STATUS.BALANCED,
    activeJobsCount: 1,
    recentCompletedJobs: 14,
    ratingAvg: 4.92,
    ratingCount: 42,
    totalEarningsGross: 24600,
    location: { lat: 28.6180, lng: 77.2110, area: 'Connaught Circus' },
    distanceToCustomerKm: 1.2,
    welfareId: 'WELFARE-DEMO-006',
    insuranceId: 'INS-DEMO-006',
    serviceAreas: ['Central Metro', 'Civil Lines'],
    reliabilityScore: 98
  },
  {
    id: 'WORKER-DEMO-007',
    userId: 'USR-WRK-007',
    code: 'WORKER-DEMO-007',
    name: 'Worker Demo 07 (Carpenter)',
    societyId: 'SOC-DEMO-001',
    serviceCategories: ['Carpentry'],
    primarySkill: 'Carpentry',
    secondarySkills: ['Furniture Joinery', 'Door Lock Installation'],
    experienceYears: 8,
    certifications: [
      {
        code: 'CERT-DEMO-CARP-01',
        title: 'Sample Woodwork Craftsman Certificate',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2022-11-20',
        verified: true
      }
    ],
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    isOnline: true,
    currentWorkload: WORKLOAD_STATUS.UNDERUTILIZED,
    activeJobsCount: 0,
    recentCompletedJobs: 18,
    ratingAvg: 4.88,
    ratingCount: 31,
    totalEarningsGross: 28400,
    location: { lat: 28.6120, lng: 77.2050, area: 'Gole Market' },
    distanceToCustomerKm: 1.8,
    welfareId: 'WELFARE-DEMO-007',
    insuranceId: 'INS-DEMO-007',
    serviceAreas: ['Central Metro', 'Karol Bagh'],
    reliabilityScore: 95
  },
  {
    id: 'WORKER-DEMO-008',
    userId: 'USR-WRK-008',
    code: 'WORKER-DEMO-008',
    name: 'Worker Demo 08 (Gardener)',
    societyId: 'SOC-DEMO-002',
    serviceCategories: ['Gardening'],
    primarySkill: 'Gardening',
    secondarySkills: ['Organic Soil Care', 'Shrub Trimming'],
    experienceYears: 5,
    certifications: [
      {
        code: 'CERT-DEMO-GARD-01',
        title: 'Sample Horticulture Assistant Certificate',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2023-09-05',
        verified: true
      }
    ],
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    isOnline: true,
    currentWorkload: WORKLOAD_STATUS.BALANCED,
    activeJobsCount: 1,
    recentCompletedJobs: 12,
    ratingAvg: 4.78,
    ratingCount: 22,
    totalEarningsGross: 16800,
    location: { lat: 28.6275, lng: 77.2960, area: 'Mayur Vihar' },
    distanceToCustomerKm: 2.1,
    welfareId: 'WELFARE-DEMO-008',
    insuranceId: 'INS-DEMO-008',
    serviceAreas: ['East District', 'Patparganj'],
    reliabilityScore: 91
  },
  {
    id: 'WORKER-DEMO-009',
    userId: 'USR-WRK-009',
    code: 'WORKER-DEMO-009',
    name: 'Worker Demo 09 (Caregiver)',
    societyId: 'SOC-DEMO-002',
    serviceCategories: ['Caregiving'],
    primarySkill: 'Caregiving',
    secondarySkills: ['First Aid & CPR', 'Elder Mobility Aid'],
    experienceYears: 6,
    certifications: [
      {
        code: 'CERT-DEMO-CARE-01',
        title: 'Sample Certified Home Caregiver Certificate',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2023-02-18',
        verified: true
      }
    ],
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    isOnline: true,
    currentWorkload: WORKLOAD_STATUS.BALANCED,
    activeJobsCount: 1,
    recentCompletedJobs: 25,
    ratingAvg: 4.96,
    ratingCount: 38,
    totalEarningsGross: 39500,
    location: { lat: 28.6300, lng: 77.2910, area: 'Mayur Vihar Phase 1' },
    distanceToCustomerKm: 1.5,
    welfareId: 'WELFARE-DEMO-009',
    insuranceId: 'INS-DEMO-009',
    serviceAreas: ['East District', 'Noida Border'],
    reliabilityScore: 99
  },
  {
    id: 'WORKER-DEMO-010',
    userId: 'USR-WRK-010',
    code: 'WORKER-DEMO-010',
    name: 'Worker Demo 10 (Cleaning Specialist)',
    societyId: 'SOC-DEMO-002',
    serviceCategories: ['Cleaning'],
    primarySkill: 'Cleaning',
    secondarySkills: ['Sanitization', 'Deep Floor Polishing'],
    experienceYears: 4,
    certifications: [
      {
        code: 'CERT-DEMO-CLEAN-01',
        title: 'Sample Sanitation Technician Certificate',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2024-01-25',
        verified: true
      }
    ],
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    isOnline: true,
    currentWorkload: WORKLOAD_STATUS.UNDERUTILIZED,
    activeJobsCount: 0,
    recentCompletedJobs: 9,
    ratingAvg: 4.82,
    ratingCount: 15,
    totalEarningsGross: 12400,
    location: { lat: 28.6320, lng: 77.2890, area: 'Pandav Nagar' },
    distanceToCustomerKm: 2.3,
    welfareId: 'WELFARE-DEMO-010',
    insuranceId: 'INS-DEMO-010',
    serviceAreas: ['East District', 'Laxmi Nagar'],
    reliabilityScore: 93
  }
];

export const initialWelfareRecords = [
  {
    id: 'WELFARE-DEMO-001',
    workerId: 'WORKER-DEMO-001',
    workerName: 'Worker Demo 01 (Worker B)',
    societyId: 'SOC-DEMO-001',
    welfareSchemeName: 'Demo Cooperative Worker Welfare Program',
    insurancePolicyNumber: 'INS-DEMO-001',
    insuranceStatus: 'Active',
    coverageAmount: 200000,
    accidentalCoverage: 300000,
    benefits: [
      'Annual Health Screening Support',
      'Safety Gear & Protective Kit Allowance',
      'Cooperative Emergency Distress Fund Coverage',
      'Child Education Grant Eligibility'
    ],
    totalContributionsContributed: 420,
    claimsProcessedCount: 1,
    lastClaimDate: '2025-06-15',
    lastClaimAmount: 3500,
    claimPurpose: 'Tool & Safety Equipment Subsidized Reimbursement',
    eligibilityStatus: 'Eligible & Enrolled',
    status: 'Active (Demo Record)'
  },
  {
    id: 'WELFARE-DEMO-002',
    workerId: 'WORKER-DEMO-002',
    workerName: 'Worker Demo 02 (Worker A)',
    societyId: 'SOC-DEMO-001',
    welfareSchemeName: 'Demo Cooperative Worker Welfare Program',
    insurancePolicyNumber: 'INS-DEMO-002',
    insuranceStatus: 'Active',
    coverageAmount: 200000,
    accidentalCoverage: 300000,
    benefits: [
      'Annual Health Screening Support',
      'Safety Gear & Protective Kit Allowance',
      'Emergency Distress Fund Coverage'
    ],
    totalContributionsContributed: 860,
    claimsProcessedCount: 0,
    eligibilityStatus: 'Eligible & Enrolled',
    status: 'Active (Demo Record)'
  },
  {
    id: 'WELFARE-DEMO-006',
    workerId: 'WORKER-DEMO-006',
    workerName: 'Worker Demo 06 (Electrician)',
    societyId: 'SOC-DEMO-001',
    welfareSchemeName: 'Demo Cooperative Worker Welfare Program',
    insurancePolicyNumber: 'INS-DEMO-006',
    insuranceStatus: 'Active',
    coverageAmount: 250000,
    accidentalCoverage: 400000,
    benefits: [
      'High-Risk Electrical Accidental Shield',
      'Insulated Safety Tooling Subsidy',
      'Health Screening Support'
    ],
    totalContributionsContributed: 610,
    claimsProcessedCount: 0,
    eligibilityStatus: 'Eligible & Enrolled',
    status: 'Active (Demo Record)'
  }
];

export const initialJobs = [
  {
    id: 'JOB-DEMO-001',
    code: 'JOB-2026-001',
    customerId: 'USR-CUST-001',
    customerName: 'Customer Demo 01',
    customerType: CUSTOMER_TYPES.HOUSEHOLD,
    customerPhone: '9876500001',
    customerAddress: 'B-42, Metro Residency, Connaught Place',
    workerId: 'WORKER-DEMO-001',
    workerName: 'Worker Demo 01 (Worker B)',
    workerPhone: '9876510001',
    societyId: 'SOC-DEMO-001',
    serviceId: 'SERV-PLUMBING',
    serviceCategory: 'Plumbing',
    serviceTitle: 'Plumbing & Sanitary Maintenance',
    problemDescription: 'Kitchen tap has continuous leakage under sink causing water wastage.',
    urgency: URGENCY_LEVELS.NORMAL,
    status: JOB_STATUSES.COMPLETED,
    pricing: {
      grossAmount: 500,
      coopContribution: 20, // 4% Configurable
      welfareDeduction: 5,   // 1% Configurable
      netWorkerEarnings: 475,
      disclaimer: 'Demo contribution model — values are configurable.'
    },
    paymentStatus: 'PAID',
    paymentMethod: 'UPI Demo',
    invoiceNumber: 'INV-DEMO-001',
    otp: '4821',
    scheduledDate: '2026-08-20',
    scheduledTime: '10:30 AM',
    allocationReason: 'Matched via Fair Work Allocation: Verified skill, available, low active workload (2 jobs), proximity (1.4 km).',
    rating: {
      score: 5,
      punctuality: 5,
      quality: 5,
      professionalism: 5,
      comment: 'Excellent plumbing fix. Arrived on time with proper cooperative identity badge.',
      createdAt: '2026-08-20T12:00:00.000Z'
    },
    workerRatingForCustomer: {
      score: 5,
      comment: 'Polite customer and clean workspace.'
    },
    createdAt: '2026-08-20T09:15:00.000Z',
    completedAt: '2026-08-20T11:45:00.000Z'
  },
  {
    id: 'JOB-DEMO-002',
    code: 'JOB-2026-002',
    customerId: 'USR-CUST-002',
    customerName: 'Customer Demo 02 (Institution)',
    customerType: CUSTOMER_TYPES.INSTITUTION,
    institutionName: 'Community Health Centre (Demo)',
    institutionType: 'Clinic / Healthcare Facility',
    contactPerson: 'Administrative Officer 01',
    customerPhone: '9876500002',
    customerAddress: 'Block C, Mayur Vihar Phase 1',
    workerId: 'WORKER-DEMO-009',
    workerName: 'Worker Demo 09 (Caregiver)',
    workerPhone: '9876510009',
    societyId: 'SOC-DEMO-002',
    serviceId: 'SERV-CAREGIVING',
    serviceCategory: 'Caregiving',
    serviceTitle: 'Elderly & Patient Caregiving Assistance',
    problemDescription: 'Daytime mobility and patient assistance needed for geriatric outpatient ward.',
    urgency: URGENCY_LEVELS.HIGH,
    status: JOB_STATUSES.IN_PROGRESS,
    pricing: {
      grossAmount: 1200,
      coopContribution: 48,
      welfareDeduction: 12,
      netWorkerEarnings: 1140,
      disclaimer: 'Demo contribution model — values are configurable.'
    },
    paymentStatus: 'PAYMENT_PENDING',
    otp: '7193',
    scheduledDate: '2026-08-22',
    scheduledTime: '09:00 AM',
    allocationReason: 'Matched: Certified Caregiver, high reliability score (99%), optimal availability.',
    createdAt: '2026-08-22T08:00:00.000Z'
  }
];

  // === NEW URBAN COMPANY STYLE SERVICES - Househelp, Beauty/Spa, Manicure/Pedicure ===
  {
    id: 'WORKER-DEMO-010',
    userId: 'USR-WRK-010',
    code: 'WORKER-DEMO-010',
    name: 'Ritu Sharma (Househelp Specialist)',
    societyId: 'SOC-DEMO-001',
    serviceCategories: ['Househelp', 'Cleaning'],
    primarySkill: 'Househelp',
    secondarySkills: ['Cooking', 'Deep Cleaning', 'Laundry'],
    experienceYears: 5,
    certifications: [
      {
        code: 'CERT-DEMO-HOUSE-001',
        title: 'Certified Domestic Help Professional',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2024-06-15',
        verified: true
      }
    ],
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    isOnline: true,
    currentWorkload: WORKLOAD_STATUS.BALANCED,
    activeJobsCount: 1,
    recentCompletedJobs: 15,
    ratingAvg: 4.92,
    ratingCount: 45,
    totalEarningsGross: 28500,
    location: { lat: 28.6180, lng: 77.2200, area: 'Karol Bagh' },
    distanceToCustomerKm: 2.1,
    welfareId: 'WELFARE-DEMO-010',
    insuranceId: 'INS-DEMO-010',
    serviceAreas: ['Karol Bagh', 'Rajouri Garden', 'Patel Nagar'],
    reliabilityScore: 96,
    instantBookingEligible: true,
    maxInstantResponseMin: 25
  },
  {
    id: 'WORKER-DEMO-011',
    userId: 'USR-WRK-011',
    code: 'WORKER-DEMO-011',
    name: 'Priya Verma (Househelp)',
    societyId: 'SOC-DEMO-001',
    serviceCategories: ['Househelp', 'Cooking'],
    primarySkill: 'Househelp',
    secondarySkills: ['North Indian Cooking', 'South Indian Cooking', 'Baking'],
    experienceYears: 7,
    certifications: [
      {
        code: 'CERT-DEMO-HOUSE-002',
        title: 'Certified Culinary & Household Professional',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2023-11-20',
        verified: true
      }
    ],
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    isOnline: true,
    currentWorkload: WORKLOAD_STATUS.LIGHT_WORKLOAD,
    activeJobsCount: 0,
    recentCompletedJobs: 22,
    ratingAvg: 4.95,
    ratingCount: 60,
    totalEarningsGross: 35000,
    location: { lat: 28.6220, lng: 77.2180, area: 'Lajpat Nagar' },
    distanceToCustomerKm: 3.5,
    welfareId: 'WELFARE-DEMO-011',
    insuranceId: 'INS-DEMO-011',
    serviceAreas: ['Lajpat Nagar', 'South Extension', 'Nehru Place'],
    reliabilityScore: 98,
    instantBookingEligible: true,
    maxInstantResponseMin: 20
  },
  {
    id: 'WORKER-DEMO-012',
    userId: 'USR-WRK-012',
    code: 'WORKER-DEMO-012',
    name: 'Anita Kumari (Beauty Expert)',
    societyId: 'SOC-DEMO-001',
    serviceCategories: ['Beauty & Spa', 'Manicure & Pedicure'],
    primarySkill: 'Beauty & Spa',
    secondarySkills: ['Facial', 'Body Massage', 'Manicure', 'Pedicure', 'Nail Art'],
    experienceYears: 6,
    certifications: [
      {
        code: 'CERT-DEMO-BEAUTY-001',
        title: 'Certified Beauty & Wellness Professional',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2024-01-10',
        verified: true
      },
      {
        code: 'CERT-DEMO-NAILS-001',
        title: 'Advanced Nail Art & Care Certificate',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2024-04-20',
        verified: true
      }
    ],
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    isOnline: true,
    currentWorkload: WORKLOAD_STATUS.BALANCED,
    activeJobsCount: 2,
    recentCompletedJobs: 18,
    ratingAvg: 4.88,
    ratingCount: 52,
    totalEarningsGross: 42000,
    location: { lat: 28.6150, lng: 77.2100, area: 'Defence Colony' },
    distanceToCustomerKm: 2.8,
    welfareId: 'WELFARE-DEMO-012',
    insuranceId: 'INS-DEMO-012',
    serviceAreas: ['Defence Colony', 'Greater Kailash', 'Saket'],
    reliabilityScore: 95
  },
  {
    id: 'WORKER-DEMO-013',
    userId: 'USR-WRK-013',
    code: 'WORKER-DEMO-013',
    name: 'Sunita Devi (Spa Therapist)',
    societyId: 'SOC-DEMO-002',
    serviceCategories: ['Beauty & Spa'],
    primarySkill: 'Beauty & Spa',
    secondarySkills: ['Aromatherapy', 'Hot Stone Massage', 'Body Scrub', 'Relaxation Therapy'],
    experienceYears: 8,
    certifications: [
      {
        code: 'CERT-DEMO-BEAUTY-002',
        title: 'Certified Spa & Wellness Therapist',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2023-09-05',
        verified: true
      }
    ],
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    isOnline: true,
    currentWorkload: WORKLOAD_STATUS.LIGHT_WORKLOAD,
    activeJobsCount: 0,
    recentCompletedJobs: 30,
    ratingAvg: 4.93,
    ratingCount: 70,
    totalEarningsGross: 56000,
    location: { lat: 28.6300, lng: 77.2900, area: 'Mayur Vihar Phase 2' },
    distanceToCustomerKm: 4.2,
    welfareId: 'WELFARE-DEMO-013',
    insuranceId: 'INS-DEMO-013',
    serviceAreas: ['Mayur Vihar', 'Trilokpuri', 'Kondli'],
    reliabilityScore: 97
  },
  {
    id: 'WORKER-DEMO-014',
    userId: 'USR-WRK-014',
    code: 'WORKER-DEMO-014',
    name: 'Kavita Joshi (Nail Artist)',
    societyId: 'SOC-DEMO-001',
    serviceCategories: ['Manicure & Pedicure'],
    primarySkill: 'Manicure & Pedicure',
    secondarySkills: ['Gel Nails', 'Nail Art', 'Paraffin Treatment', 'Foot Spa'],
    experienceYears: 4,
    certifications: [
      {
        code: 'CERT-DEMO-NAILS-002',
        title: 'Professional Nail Art & Care Specialist',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2024-07-12',
        verified: true
      }
    ],
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    isOnline: true,
    currentWorkload: WORKLOAD_STATUS.BALANCED,
    activeJobsCount: 1,
    recentCompletedJobs: 12,
    ratingAvg: 4.85,
    ratingCount: 35,
    totalEarningsGross: 22000,
    location: { lat: 28.6170, lng: 77.2130, area: 'Connaught Place' },
    distanceToCustomerKm: 0.8,
    welfareId: 'WELFARE-DEMO-014',
    insuranceId: 'INS-DEMO-014',
    serviceAreas: ['Connaught Place', 'Janpath', 'Barakhamba'],
    reliabilityScore: 93
  },
  {
    id: 'WORKER-DEMO-015',
    userId: 'USR-WRK-015',
    code: 'WORKER-DEMO-015',
    name: 'Deepa Nair (Househelp)',
    societyId: 'SOC-DEMO-002',
    serviceCategories: ['Househelp', 'Cleaning'],
    primarySkill: 'Househelp',
    secondarySkills: ['Deep Cleaning', 'Kitchen Maintenance', 'Bathroom Sanitization'],
    experienceYears: 3,
    certifications: [
      {
        code: 'CERT-DEMO-HOUSE-003',
        title: 'Certified Professional Cleaner',
        issuedBy: 'Cooperative Skill Verification Board',
        issuedDate: '2025-02-01',
        verified: true
      }
    ],
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    isOnline: true,
    currentWorkload: WORKLOAD_STATUS.LIGHT_WORKLOAD,
    activeJobsCount: 0,
    recentCompletedJobs: 8,
    ratingAvg: 4.80,
    ratingCount: 18,
    totalEarningsGross: 14000,
    location: { lat: 28.6260, lng: 77.2980, area: 'Preet Vihar' },
    distanceToCustomerKm: 5.0,
    welfareId: 'WELFARE-DEMO-015',
    insuranceId: 'INS-DEMO-015',
    serviceAreas: ['Preet Vihar', 'Vasundhara Enclave', 'New Ashok Nagar'],
    reliabilityScore: 91,
    instantBookingEligible: true,
    maxInstantResponseMin: 30
  }
];

export const initialComplaints = [
  {
    id: 'CMP-DEMO-001',
    code: 'CMP-2026-001',
    jobId: 'JOB-DEMO-001',
    customerId: 'USR-CUST-001',
    customerName: 'Customer Demo 01',
    workerId: 'WORKER-DEMO-001',
    workerName: 'Worker Demo 01 (Worker B)',
    societyId: 'SOC-DEMO-001',
    category: 'Billing Query',
    description: 'Requested clarification on cooperative welfare fund deduction printed on invoice receipt.',
    priority: 'Low',
    status: COMPLAINT_STATUS.CLOSED,
    resolutionNotes: 'Society admin explained the 1% welfare fund cooperative contribution for worker welfare protection. Customer satisfied.',
    createdAt: '2026-08-20T14:30:00.000Z',
    resolvedAt: '2026-08-20T16:00:00.000Z'
  }
];

export const initialDemandData = [
  {
    id: 'DEMAND-001',
    region: 'North District',
    district: 'North District',
    serviceCategory: 'Plumbing',
    date: '2026-08-23',
    timeSlot: 'Morning (09:00 - 13:00)',
    historicalAvgJobs: 18,
    predictedDemand: 24,
    demandLevel: 'High',
    activeWorkersAvailable: 15,
    potentialShortage: 9,
    recommendation: 'Mobilize 4-6 certified plumbers from East District / reserve roster to North District.',
    status: 'Model Estimate — Demo'
  },
  {
    id: 'DEMAND-002',
    region: 'Central Metro',
    district: 'Central Metro',
    serviceCategory: 'Electrical',
    date: '2026-08-23',
    timeSlot: 'Afternoon (13:00 - 17:00)',
    historicalAvgJobs: 12,
    predictedDemand: 14,
    demandLevel: 'Balanced',
    activeWorkersAvailable: 14,
    potentialShortage: 0,
    recommendation: 'Workforce adequately balanced with demand forecast.',
    status: 'Model Estimate — Demo'
  },
  {
    id: 'DEMAND-003',
    region: 'East District',
    district: 'East District',
    serviceCategory: 'Caregiving',
    date: '2026-08-23',
    timeSlot: 'Full Day',
    historicalAvgJobs: 8,
    predictedDemand: 13,
    demandLevel: 'High',
    activeWorkersAvailable: 7,
    potentialShortage: 6,
    recommendation: 'Alert Society SOC-DEMO-002 to open on-call caregiver slots.',
    status: 'Model Estimate — Demo'
  }
];

export const initialAuditLogs = [
  {
    id: 'AUDIT-001',
    actorName: 'Society Admin 01',
    actorRole: 'society_admin',
    action: 'WORKER_SKILL_VERIFIED',
    module: 'Worker Management',
    recordId: 'WORKER-DEMO-001',
    details: 'Verified certification CERT-DEMO-002 for Worker Demo 01',
    timestamp: '2026-08-15T10:00:00.000Z'
  },
  {
    id: 'AUDIT-002',
    actorName: 'Fair Allocation Engine',
    actorRole: 'system',
    action: 'JOB_ALLOCATED',
    module: 'Dispatch & Matching',
    recordId: 'JOB-DEMO-001',
    details: 'Allocated job to Worker Demo 01 with fairness score 91.8/100',
    timestamp: '2026-08-20T09:16:00.000Z'
  }
];
