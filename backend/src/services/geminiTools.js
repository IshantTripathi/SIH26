import { store } from '../data/store.js';
import { rankWorkersForJob, scoreWorkerForJob, calculateDistanceKm } from './fairAllocationEngine.js';
import { getDemandForecast } from './demandForecastService.js';
import { ROLES, VERIFICATION_STATUS, WORKLOAD_STATUS, JOB_STATUSES } from '../config/constants.js';

/**
 * Tool Declarations for Gemini Function Calling (@google/genai format)
 */
export const geminiToolDeclarations = [
  {
    name: 'getActiveWorkers',
    description: 'Query active cooperative workers by trade/service category, location area or availability. Returns live database records with verification and workload status.',
    parameters: {
      type: 'OBJECT',
      properties: {
        serviceType: {
          type: 'STRING',
          description: 'Trade or service category (e.g. "Plumbing", "Electrical", "Cleaning", "Carpentry", "Appliance Repair", "Painting", "Gardening", "Caregiving")'
        },
        area: {
          type: 'STRING',
          description: 'Area, city, or district name (e.g. "Connaught Place", "Mayur Vihar", "Central Metro", "East District")'
        },
        isOnline: {
          type: 'BOOLEAN',
          description: 'Set true to find workers who are currently on-duty and online'
        }
      }
    }
  },
  {
    name: 'findNearbyWorkers',
    description: 'Find verified cooperative workers located near specific coordinates or area with proximity distance calculation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        serviceType: {
          type: 'STRING',
          description: 'Requested service category (e.g. "Plumbing", "Electrical")'
        },
        lat: {
          type: 'NUMBER',
          description: 'Latitude coordinate of customer location'
        },
        lng: {
          type: 'NUMBER',
          description: 'Longitude coordinate of customer location'
        },
        radiusKm: {
          type: 'NUMBER',
          description: 'Search radius in kilometers (default: 5 km)'
        },
        area: {
          type: 'STRING',
          description: 'Optional area name if coordinates are not known'
        }
      }
    }
  },
  {
    name: 'getWorkerAvailability',
    description: 'Get current on-duty status, active workload, rating, and verified credentials for a specific worker or trade.',
    parameters: {
      type: 'OBJECT',
      properties: {
        workerId: {
          type: 'STRING',
          description: 'Worker ID or Worker Code (e.g. "WORKER-DEMO-001")'
        },
        serviceType: {
          type: 'STRING',
          description: 'Service trade category'
        }
      }
    }
  },
  {
    name: 'getCustomerJobs',
    description: 'Retrieve the authenticated customer\'s own booking history and active service requests. Uses session authentication to ensure strict privacy.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: {
          type: 'STRING',
          description: 'Optional status filter: "REQUESTED", "MATCHING", "OFFERED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "PAID", "CANCELLED"'
        }
      }
    }
  },
  {
    name: 'getWorkerJobs',
    description: 'Retrieve the authenticated worker\'s own assigned jobs, schedules, and job status. Uses session authentication.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: {
          type: 'STRING',
          description: 'Optional status filter: "OFFERED", "ACCEPTED", "IN_PROGRESS", "COMPLETED"'
        }
      }
    }
  },
  {
    name: 'getServiceCategories',
    description: 'List all currently active cooperative service categories, standard transparent base pricing, and required skill certifications.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'getDemandSummary',
    description: 'Retrieve live regional service demand summaries, current workforce availability, and potential shortages across cooperative zones.',
    parameters: {
      type: 'OBJECT',
      properties: {
        district: {
          type: 'STRING',
          description: 'District name (e.g. "Central Metro", "East District", "North District")'
        },
        serviceCategory: {
          type: 'STRING',
          description: 'Service category (e.g. "Plumbing", "Electrical", "Caregiving")'
        }
      }
    }
  },
  {
    name: 'getLatestForecast',
    description: 'Retrieve machine learning demand forecasts and workforce planning estimates. Note: Data is generated from predictive regression models.',
    parameters: {
      type: 'OBJECT',
      properties: {
        district: {
          type: 'STRING',
          description: 'District or region name'
        },
        category: {
          type: 'STRING',
          description: 'Service category (e.g. "Plumbing", "Caregiving")'
        }
      }
    }
  },
  {
    name: 'explainWorkerRecommendation',
    description: 'Explain why a specific worker is recommended for a service request using the platform\'s multi-factor Fair Work Allocation Engine.',
    parameters: {
      type: 'OBJECT',
      properties: {
        workerId: {
          type: 'STRING',
          description: 'Worker ID to explain (e.g. "WORKER-DEMO-001")'
        },
        serviceCategory: {
          type: 'STRING',
          description: 'Service category (e.g. "Plumbing")'
        }
      }
    }
  },
  {
    name: 'getWelfareAndBenefits',
    description: 'Get worker welfare coverage, insurance policy details, emergency distress fund status, and cooperative surplus dividend information.',
    parameters: {
      type: 'OBJECT',
      properties: {
        workerId: {
          type: 'STRING',
          description: 'Optional Worker ID (defaults to authenticated worker profile)'
        }
      }
    }
  },
  {
    name: 'getSocietyOverview',
    description: 'Get cooperative society operational statistics, workforce size, active jobs count, and dispute metrics (Admin only).',
    parameters: {
      type: 'OBJECT',
      properties: {
        societyId: {
          type: 'STRING',
          description: 'Cooperative Society ID (e.g. "SOC-DEMO-001")'
        }
      }
    }
  },
  {
    name: 'getEmergencyServices',
    description: 'Get details on 24/7 cooperative emergency services, priority response protocols, and emergency safety workflows.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  }
];

/**
 * Read-Only Tool Execution Dispatcher
 * Strictly read-only queries with backend role authorization enforcement.
 */
export async function executeTool(toolName, args = {}, authUser = {}) {
  const user = authUser || { role: 'customer', id: 'anonymous' };

  try {
    switch (toolName) {
      case 'getActiveWorkers': {
        const { serviceType, area, isOnline } = args;
        let workers = store.getCollection('workers');

        if (serviceType) {
          const s = serviceType.toLowerCase();
          workers = workers.filter(w =>
            w.primarySkill?.toLowerCase().includes(s) ||
            w.serviceCategories?.some(c => c.toLowerCase().includes(s)) ||
            w.secondarySkills?.some(c => c.toLowerCase().includes(s))
          );
        }

        if (area) {
          const a = area.toLowerCase();
          workers = workers.filter(w =>
            w.location?.area?.toLowerCase().includes(a) ||
            w.serviceAreas?.some(sa => sa.toLowerCase().includes(a))
          );
        }

        if (typeof isOnline === 'boolean') {
          workers = workers.filter(w => w.isOnline === isOnline);
        }

        const verifiedCount = workers.filter(w => w.verificationStatus === VERIFICATION_STATUS.VERIFIED).length;
        const onlineCount = workers.filter(w => w.isOnline).length;

        // Return sanitized summary (no sensitive data)
        const workerSummaries = workers.map(w => ({
          id: w.id,
          code: w.code,
          name: w.name,
          primarySkill: w.primarySkill,
          experienceYears: w.experienceYears,
          verificationStatus: w.verificationStatus,
          isOnline: w.isOnline,
          currentWorkload: w.currentWorkload,
          activeJobsCount: w.activeJobsCount,
          ratingAvg: w.ratingAvg,
          ratingCount: w.ratingCount,
          societyId: w.societyId,
          area: w.location?.area || 'Central Metro',
          distanceToCustomerKm: w.distanceToCustomerKm || 1.5
        }));

        return {
          success: true,
          count: workers.length,
          verifiedCount,
          onlineCount,
          serviceTypeFilter: serviceType || 'All',
          areaFilter: area || 'All',
          workers: workerSummaries.slice(0, 10)
        };
      }

      case 'findNearbyWorkers': {
        const { serviceType, lat, lng, radiusKm = 5, area } = args;
        const customerLat = lat || user.location?.lat || 28.6140;
        const customerLng = lng || user.location?.lng || 77.2095;

        let workers = store.getCollection('workers');

        if (serviceType) {
          const s = serviceType.toLowerCase();
          workers = workers.filter(w =>
            w.primarySkill?.toLowerCase().includes(s) ||
            w.serviceCategories?.some(c => c.toLowerCase().includes(s))
          );
        }

        if (area) {
          const a = area.toLowerCase();
          workers = workers.filter(w =>
            w.location?.area?.toLowerCase().includes(a) ||
            w.serviceAreas?.some(sa => sa.toLowerCase().includes(a))
          );
        }

        const nearby = workers.map(w => {
          const wLat = w.location?.lat || 28.6140;
          const wLng = w.location?.lng || 77.2095;
          const distanceKm = w.distanceToCustomerKm !== undefined
            ? w.distanceToCustomerKm
            : calculateDistanceKm(customerLat, customerLng, wLat, wLng);

          return {
            id: w.id,
            code: w.code,
            name: w.name,
            primarySkill: w.primarySkill,
            distanceKm,
            verificationStatus: w.verificationStatus,
            isOnline: w.isOnline,
            currentWorkload: w.currentWorkload,
            activeJobsCount: w.activeJobsCount,
            ratingAvg: w.ratingAvg,
            area: w.location?.area || 'Metro Area',
            societyId: w.societyId
          };
        }).filter(w => w.distanceKm <= radiusKm);

        // Sort by distance
        nearby.sort((a, b) => a.distanceKm - b.distanceKm);

        return {
          success: true,
          searchOrigin: { lat: customerLat, lng: customerLng, area: area || user.location?.area || 'Connaught Place' },
          radiusKm,
          count: nearby.length,
          nearbyWorkers: nearby
        };
      }

      case 'getWorkerAvailability': {
        const { workerId, serviceType } = args;
        let workers = store.getCollection('workers');

        if (workerId) {
          const w = workers.find(item => item.id === workerId || item.code === workerId);
          if (!w) {
            return { success: false, message: `Worker ${workerId} not found in cooperative directory.` };
          }
          return {
            success: true,
            worker: {
              id: w.id,
              code: w.code,
              name: w.name,
              primarySkill: w.primarySkill,
              isOnline: w.isOnline,
              currentWorkload: w.currentWorkload,
              activeJobsCount: w.activeJobsCount,
              ratingAvg: w.ratingAvg,
              verificationStatus: w.verificationStatus,
              serviceAreas: w.serviceAreas
            }
          };
        }

        if (serviceType) {
          const s = serviceType.toLowerCase();
          const available = workers.filter(w =>
            w.isOnline &&
            (w.primarySkill?.toLowerCase().includes(s) || w.serviceCategories?.some(c => c.toLowerCase().includes(s)))
          );

          return {
            success: true,
            serviceType,
            availableOnlineCount: available.length,
            workers: available.map(w => ({
              id: w.id,
              name: w.name,
              workload: w.currentWorkload,
              activeJobs: w.activeJobsCount,
              rating: w.ratingAvg
            }))
          };
        }

        return {
          success: true,
          totalWorkers: workers.length,
          onlineWorkers: workers.filter(w => w.isOnline).length
        };
      }

      case 'getCustomerJobs': {
        // Enforce customer session security: Always use authenticated user's ID
        const customerId = user.id || 'USR-CUST-001';
        let jobs = store.find('jobs', { customerId });

        if (args.status) {
          jobs = jobs.filter(j => j.status?.toUpperCase() === args.status.toUpperCase());
        }

        const sanitizedJobs = jobs.map(j => ({
          id: j.id,
          code: j.code,
          serviceCategory: j.serviceCategory,
          serviceTitle: j.serviceTitle || `${j.serviceCategory} Service`,
          problemDescription: j.problemDescription,
          urgency: j.urgency,
          status: j.status,
          scheduledDate: j.scheduledDate,
          scheduledTime: j.scheduledTime,
          pricing: {
            grossAmount: j.pricing?.grossAmount || 500,
            coopContribution: j.pricing?.coopContribution || 20,
            welfareDeduction: j.pricing?.welfareDeduction || 5,
            netWorkerEarnings: j.pricing?.netWorkerEarnings || 475
          },
          paymentStatus: j.paymentStatus,
          invoiceNumber: j.invoiceNumber,
          otp: j.status === JOB_STATUSES.IN_PROGRESS || j.status === JOB_STATUSES.ACCEPTED ? j.otp : undefined,
          assignedWorker: j.workerId ? {
            name: j.workerName || 'Assigned Worker',
            code: j.workerId
          } : null,
          allocationReason: j.allocationReason,
          createdAt: j.createdAt
        }));

        return {
          success: true,
          customerId,
          customerName: user.name,
          count: sanitizedJobs.length,
          jobs: sanitizedJobs
        };
      }

      case 'getWorkerJobs': {
        // Enforce worker session security: Always use authenticated worker profile
        const workerId = user.workerId || user.id;
        if (!workerId || (user.role !== ROLES.WORKER && user.role !== ROLES.PLATFORM_ADMIN)) {
          return {
            success: false,
            message: 'Worker job records are only accessible to verified worker accounts.'
          };
        }

        let jobs = store.find('jobs', { workerId });
        if (args.status) {
          jobs = jobs.filter(j => j.status?.toUpperCase() === args.status.toUpperCase());
        }

        const sanitized = jobs.map(j => ({
          id: j.id,
          code: j.code,
          serviceCategory: j.serviceCategory,
          serviceTitle: j.serviceTitle,
          status: j.status,
          scheduledDate: j.scheduledDate,
          scheduledTime: j.scheduledTime,
          customerAddress: j.customerAddress,
          customerType: j.customerType,
          netPay: j.pricing?.netWorkerEarnings || 475,
          grossAmount: j.pricing?.grossAmount || 500,
          paymentStatus: j.paymentStatus,
          allocationReason: j.allocationReason
        }));

        return {
          success: true,
          workerId,
          workerName: user.name,
          count: sanitized.length,
          jobs: sanitized
        };
      }

      case 'getServiceCategories': {
        const services = store.getCollection('services');
        return {
          success: true,
          count: services.length,
          services: services.map(s => ({
            id: s.id,
            category: s.category,
            title: s.title,
            description: s.description,
            basePrice: s.basePrice,
            priceUnit: s.priceUnit,
            estimatedDurationMin: s.estimatedDurationMin,
            requiredCertifications: s.requiredCertifications
          }))
        };
      }

      case 'getDemandSummary': {
        const { district, serviceCategory } = args;
        let demandList = store.demandData || [];

        if (district && district !== 'all') {
          demandList = demandList.filter(d =>
            d.district?.toLowerCase().includes(district.toLowerCase()) ||
            d.region?.toLowerCase().includes(district.toLowerCase())
          );
        }

        if (serviceCategory && serviceCategory !== 'all') {
          demandList = demandList.filter(d =>
            d.serviceCategory?.toLowerCase().includes(serviceCategory.toLowerCase())
          );
        }

        return {
          success: true,
          count: demandList.length,
          demandData: demandList.map(d => ({
            district: d.district,
            region: d.region,
            serviceCategory: d.serviceCategory,
            demandLevel: d.demandLevel,
            activeWorkersAvailable: d.activeWorkersAvailable,
            predictedDemand: d.predictedDemand,
            potentialShortage: d.potentialShortage,
            trend: d.trend,
            tag: 'Model Estimate — Demo'
          }))
        };
      }

      case 'getLatestForecast': {
        const { district, category } = args;
        const forecast = await getDemandForecast({ district, category });
        return {
          success: true,
          tag: 'Model Estimate — Demo',
          disclaimer: 'Model estimates are generated from demo regression time-series forecasting and are provided for workforce planning.',
          ...forecast
        };
      }

      case 'explainWorkerRecommendation': {
        const { workerId, serviceCategory = 'Plumbing' } = args;
        const request = {
          serviceCategory,
          urgency: 'Normal',
          customerLocation: user.location || { lat: 28.6140, lng: 77.2095 }
        };

        const result = rankWorkersForJob(request);
        const targetWorkerId = workerId || result.recommendedWorker?.workerId;

        const evaluatedCandidate = result.rankedCandidates.find(c => c.workerId === targetWorkerId) || result.recommendedWorker;

        if (!evaluatedCandidate) {
          return {
            success: false,
            message: `No allocation metadata found for worker ${targetWorkerId} in category ${serviceCategory}.`
          };
        }

        return {
          success: true,
          serviceCategory,
          workerId: evaluatedCandidate.workerId,
          workerName: evaluatedCandidate.workerName,
          totalScore: evaluatedCandidate.totalScore,
          breakdown: evaluatedCandidate.breakdown,
          recommendationReason: evaluatedCandidate.recommendationReason,
          cooperativePillars: [
            'Fair Workload Balancing: Penalizes fatigue/overload, prioritizes underutilized verified workers',
            'Verified Skill & Certification: Mandates verified cooperative trade badges',
            'Duty Status: Online and ready for assignment',
            'Fair Geographic Proximity: Minimizes travel time while preventing worker monopoly',
            'Punctuality & Reliability: Rewarded for on-time arrival track record'
          ]
        };
      }

      case 'getWelfareAndBenefits': {
        const workerId = args.workerId || user.workerId || 'WORKER-DEMO-001';
        const welfare = store.findOne('welfareRecords', { workerId }) || store.getCollection('welfareRecords')[0];
        const dividend = store.dividendPool || { totalSurplus: 125000, distributionPeriod: 'Q3 2026', status: 'Pending Distribution' };

        return {
          success: true,
          workerId,
          welfareRecord: welfare ? {
            schemeName: welfare.welfareSchemeName,
            insurancePolicyNumber: welfare.insurancePolicyNumber,
            insuranceStatus: welfare.insuranceStatus,
            healthCoverageAmount: welfare.coverageAmount,
            accidentalCoverage: welfare.accidentalCoverage,
            benefits: welfare.benefits,
            claimsProcessedCount: welfare.claimsProcessedCount,
            lastClaimDate: welfare.lastClaimDate,
            lastClaimAmount: welfare.lastClaimAmount,
            eligibilityStatus: welfare.eligibilityStatus
          } : null,
          dividendPool: dividend,
          guaranteeFund: store.guaranteePool || { balance: 50000, minWorkerEarnings: 15000 }
        };
      }

      case 'getSocietyOverview': {
        if (![ROLES.SOCIETY_ADMIN, ROLES.FEDERATION_ADMIN, ROLES.PLATFORM_ADMIN].includes(user.role)) {
          return {
            success: false,
            message: 'Society administrative overview is restricted to Cooperative Society & Federation Administrators.'
          };
        }

        const societyId = args.societyId || user.societyId || 'SOC-DEMO-001';
        const society = store.findById('societies', societyId);
        const workers = store.find('workers', { societyId });
        const jobs = store.find('jobs', { societyId });
        const complaints = store.find('complaints', { societyId });

        return {
          success: true,
          society: society ? {
            id: society.id,
            name: society.name,
            district: society.district,
            registrationNumber: society.registrationNumber,
            coverageRadiusKm: society.coverageRadiusKm,
            coopContributionPercent: society.coopContributionPercent,
            welfareFundPercent: society.welfareFundPercent,
            workerPayoutPercent: society.workerPayoutPercent
          } : null,
          totalWorkers: workers.length,
          verifiedWorkersCount: workers.filter(w => w.verificationStatus === VERIFICATION_STATUS.VERIFIED).length,
          activeJobsCount: jobs.filter(j => j.status === JOB_STATUSES.IN_PROGRESS || j.status === JOB_STATUSES.ACCEPTED).length,
          completedJobsCount: jobs.filter(j => j.status === JOB_STATUSES.COMPLETED || j.status === JOB_STATUSES.PAID).length,
          openComplaintsCount: complaints.filter(c => c.status !== 'Closed' && c.status !== 'Resolution').length
        };
      }

      case 'getEmergencyServices': {
        return {
          success: true,
          emergencyHotline: '1800-COOP-HELP (Demo 24/7 Hotline)',
          availableEmergencyCategories: ['Plumbing', 'Electrical'],
          sla: '15-20 minutes priority response window',
          safetyProtocols: [
            'Immediate notification to nearest 3 on-duty verified workers',
            'Real-time SOS live location broadcasting',
            'Direct escalation to Cooperative Society Emergency Coordinator'
          ]
        };
      }

      default:
        return { success: false, message: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    console.error(`[Gemini Tool Execution Error] (${toolName}):`, err.message);
    return { success: false, error: err.message };
  }
}
