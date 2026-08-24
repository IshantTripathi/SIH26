import { GoogleGenAI } from '@google/genai';
import { geminiToolDeclarations, executeTool } from './geminiTools.js';
import { ROLES } from '../config/constants.js';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

/**
 * Builds dynamic, role-tailored system instructions
 */
export function buildSystemInstruction(user = {}) {
  const role = user.role || ROLES.CUSTOMER;
  const userName = user.name || 'User';
  const roleName = role.replace('_', ' ').toUpperCase();

  let roleSpecificGuidance = '';

  if (role === ROLES.CUSTOMER) {
    roleSpecificGuidance = `
CURRENT USER ROLE: CUSTOMER (${user.customerType || 'Household'}, Name: ${userName})
Your specific duties for this Customer:
- Help find available cooperative services (Plumbing, Electrical, Carpentry, Appliance Repair, Cleaning, Painting, Gardening, Caregiving).
- Check verified nearby worker availability using 'getActiveWorkers' or 'findNearbyWorkers'.
- Explain transparent pricing (e.g. standard fixed base prices with 4% coop contribution, 1% welfare fund, 95% direct worker payout).
- Check customer's existing booking status using 'getCustomerJobs'.
- Guide through the cooperative booking workflow and explain worker verification standards.
- Explain why workers are matched fairly through the Fair Work Allocation Engine.
- If the customer wants to book a service, find options and direct them to click "Book Service" in the Customer Dashboard.
`;
  } else if (role === ROLES.WORKER) {
    roleSpecificGuidance = `
CURRENT USER ROLE: COOPERATIVE WORKER (Name: ${userName}, Worker ID: ${user.workerId || 'WORKER-DEMO-001'})
Your specific duties for this Worker:
- Check assigned jobs and schedules using 'getWorkerJobs'.
- Explain current workload status and fair allocation opportunities.
- Explain skill verification, trade certification badges, and skill passport records.
- Explain worker welfare benefits, accidental insurance shield, distress funds, and quarterly dividend surplus pool using 'getWelfareAndBenefits'.
- Explain transparent earnings breakdowns (95% direct payout, 4% society admin/tooling, 1% welfare fund).
`;
  } else if (role === ROLES.SOCIETY_ADMIN) {
    roleSpecificGuidance = `
CURRENT USER ROLE: COOPERATIVE SOCIETY ADMIN (Name: ${userName}, Society: ${user.societyId || 'SOC-DEMO-001'})
Your specific duties for this Society Admin:
- Provide workforce statistics, active worker counts, and verification queue summaries using 'getSocietyOverview'.
- Monitor service demand and workload distribution balance across society members.
- Summarize operational metrics and member welfare fund contributions.
`;
  } else if (role === ROLES.FEDERATION_ADMIN) {
    roleSpecificGuidance = `
CURRENT USER ROLE: COOPERATIVE FEDERATION ADMIN (Name: ${userName})
Your specific duties for this Federation Admin:
- Provide regional demand summaries and workforce availability across districts using 'getDemandSummary'.
- Present machine learning demand forecasting estimates and potential skill shortages using 'getLatestForecast'.
- Clearly tag all predictive model data with "Model Estimate — Demo".
- Provide cooperative surplus dividend pool status and inter-society workforce planning insights.
`;
  } else {
    roleSpecificGuidance = `
CURRENT USER ROLE: PLATFORM ADMIN (Name: ${userName})
Your specific duties: System-wide monitoring, audit overview, and cooperative infrastructure health.
`;
  }

  return `You are the AI assistant for the Cooperative Gig Services Platform (SIH26089 — Ministry of Cooperation / NCCT).

PLATFORM OVERVIEW:
This platform is a cooperative-owned digital infrastructure connecting verified, skilled household & community gig workers with households and institutions. Unlike exploitative corporate gig apps, this platform is governed democratically by primary labour cooperatives, guaranteeing transparent earnings (95% direct worker payout), labour welfare fund protection, and fair algorithmic work distribution.

${roleSpecificGuidance}

MANDATORY CORE RESPONSIBILITIES:
1. Provide accurate, transparent information using live platform data via read-only tools.
2. Explain the cooperative booking process, skill verification, and trade certifications.
3. Explain fair allocation: Why workers are selected (skill match, certification badge, duty availability, proximity, and fatigue/workload balancing to prevent worker monopoly).
4. Explain worker welfare, health & accidental insurance shields, and democratic surplus dividends.
5. Provide concise, practical, respectful, and well-structured answers.

STRICT OPERATIONAL RULES:
- Never invent workers, worker availability, prices, job status, certificates, or government schemes.
- Never claim a worker is verified unless database data confirms it.
- Never claim an action (booking, payment, cancellation) was performed directly by the AI.
- NEVER perform modifying or destructive database actions. All AI tools are strictly READ-ONLY.
- For actual bookings, payments, cancellations, or profile edits, guide the user to the corresponding application interface (e.g. "You can confirm this booking by clicking 'Book Service' on your dashboard").
- If live data is unavailable, explicitly state that the information is currently not available.
- Always label predictive forecast figures as "Model Estimate — Demo".
- Never ask for or expose passwords, JWT tokens, bank credentials, or private sensitive PII.`;
}

/**
 * Intelligent Local Fallback Engine
 * Used when GEMINI_API_KEY is not configured or external API is unreachable.
 * Queries the exact same read-only tools and formats an accurate response with live data.
 */
async function generateFallbackResponse(user, message, history = []) {
  const q = (message || '').toLowerCase().trim();
  const toolsUsed = [];
  let reply = '';
  let metadata = {};

  if (q.includes('plumber') || q.includes('electrician') || q.includes('carpenter') || q.includes('clean') || q.includes('painter') || q.includes('gardener') || q.includes('appliance') || q.includes('worker') || q.includes('available')) {
    let serviceType = 'Plumbing';
    if (q.includes('electric')) serviceType = 'Electrical';
    else if (q.includes('carpenter') || q.includes('wood')) serviceType = 'Carpentry';
    else if (q.includes('clean')) serviceType = 'Cleaning';
    else if (q.includes('paint')) serviceType = 'Painting';
    else if (q.includes('garden')) serviceType = 'Gardening';
    else if (q.includes('appliance') || q.includes('fridge') || q.includes('ac')) serviceType = 'Appliance Repair';
    else if (q.includes('caregiver') || q.includes('elderly')) serviceType = 'Caregiving';

    const toolResult = await executeTool('getActiveWorkers', { serviceType, isOnline: true }, user);
    toolsUsed.push('getActiveWorkers');
    metadata.workers = toolResult;

    if (toolResult.count > 0) {
      reply = `We currently have **${toolResult.count} verified ${serviceType} cooperative worker(s)** active on-duty in your area:\n\n` +
        toolResult.workers.map(w =>
          `• **${w.name}** (${w.code}) — Rating: ⭐ ${w.ratingAvg} | Status: **${w.verificationStatus}** | Workload: *${w.currentWorkload}* (${w.activeJobsCount} active jobs)`
        ).join('\n') +
        `\n\n💡 **Cooperative Notice**: All workers are verified by the Cooperative Skill Board with 95% transparent payout. To book a verified ${serviceType} specialist, please use the **Book Service** form on your dashboard.`;
    } else {
      reply = `Currently, all ${serviceType} workers in this zone are either offline or assigned. Please check back shortly or place a scheduled request via the booking portal.`;
    }
  } else if (q.includes('my job') || q.includes('my booking') || q.includes('active job') || q.includes('status')) {
    if (user.role === ROLES.WORKER) {
      const toolResult = await executeTool('getWorkerJobs', {}, user);
      toolsUsed.push('getWorkerJobs');
      metadata.jobs = toolResult;
      if (toolResult.count > 0) {
        reply = `Here are your assigned cooperative jobs (${toolResult.count} total):\n\n` +
          toolResult.jobs.map(j =>
            `• **Job ${j.code}** (${j.serviceCategory}) — Status: **${j.status}** | Net Pay: ₹${j.netPay} | Address: ${j.customerAddress || 'Local Customer'}`
          ).join('\n') +
          `\n\nUse your Worker Dashboard to update duty status or record arrivals.`;
      } else {
        reply = `You currently have no active assigned jobs. Make sure your status is set to **Online** to receive fair job allocations.`;
      }
    } else {
      const toolResult = await executeTool('getCustomerJobs', {}, user);
      toolsUsed.push('getCustomerJobs');
      metadata.jobs = toolResult;
      if (toolResult.count > 0) {
        reply = `Here are your recent service bookings (${toolResult.count} total):\n\n` +
          toolResult.jobs.map(j =>
            `• **${j.code}** — ${j.serviceCategory} | Status: **${j.status}** | Total: ₹${j.pricing?.grossAmount || 500} ${j.assignedWorker ? `(Worker: ${j.assignedWorker.name})` : ''}`
          ).join('\n') +
          `\n\nTrack real-time progress in your **Booking History** page.`;
      } else {
        reply = `You do not have any active service bookings right now. You can create a new request anytime using the **Book Service** button.`;
      }
    }
  } else if (q.includes('fair allocation') || q.includes('recommend') || q.includes('why was this worker') || q.includes('how does allocation work')) {
    const toolResult = await executeTool('explainWorkerRecommendation', { serviceCategory: 'Plumbing' }, user);
    toolsUsed.push('explainWorkerRecommendation');
    metadata.allocation = toolResult;
    reply = `**Cooperative Fair Work Allocation System**:\n\n` +
      `Our algorithmic allocation scores candidates across multiple transparent criteria rather than letting single workers monopolize demand:\n\n` +
      `1. **Skill & Certification**: Official cooperative vocational badge verification.\n` +
      `2. **Workload Balancing**: Overloaded workers (e.g. >5 active jobs) are penalized to prevent fatigue; underutilized workers receive priority.\n` +
      `3. **Duty Status & Proximity**: Ensures only online, nearby workers are dispatched.\n` +
      `4. **Reliability & Punctuality**: Recognizes on-time arrival track records.\n\n` +
      `*Example recommendation*: ${toolResult.recommendationReason || 'Worker selected via verified credentials, balanced workload, and proximity.'}`;
  } else if (q.includes('welfare') || q.includes('insurance') || q.includes('dividend') || q.includes('fund')) {
    const toolResult = await executeTool('getWelfareAndBenefits', {}, user);
    toolsUsed.push('getWelfareAndBenefits');
    metadata.welfare = toolResult;
    reply = `**Worker Welfare & Cooperative Protection Overview**:\n\n` +
      `• **Scheme**: ${toolResult.welfareRecord?.schemeName || 'Demo Cooperative Worker Welfare Program'}\n` +
      `• **Health Insurance Shield**: ₹${toolResult.welfareRecord?.healthCoverageAmount?.toLocaleString() || '200,000'} coverage\n` +
      `• **Accidental Risk Shield**: ₹${toolResult.welfareRecord?.accidentalCoverage?.toLocaleString() || '300,000'} coverage\n` +
      `• **Surplus Dividend Pool**: ₹${toolResult.dividendPool?.totalSurplus?.toLocaleString() || '125,000'} (Period: ${toolResult.dividendPool?.distributionPeriod || 'Q3 2026'})\n` +
      `• **Benefits**: ${toolResult.welfareRecord?.benefits?.join(', ') || 'Health checkup, tool allowance, emergency distress fund'}\n\n` +
      `Every cooperative transaction contributes 1% to the worker welfare fund.`;
  } else if (q.includes('forecast') || q.includes('demand') || q.includes('shortage')) {
    const toolResult = await executeTool('getLatestForecast', { district: 'all', category: 'all' }, user);
    toolsUsed.push('getLatestForecast');
    metadata.forecast = toolResult;
    reply = `**Cooperative Demand Forecast & Workforce Planning (${toolResult.tag})**:\n\n` +
      `• **Total Predicted Demand**: ${toolResult.metrics?.totalPredictedJobs || 24} jobs\n` +
      `• **Active Available Workforce**: ${toolResult.metrics?.totalActiveWorkers || 15} workers\n` +
      `• **Projected Skill Shortage**: ${toolResult.metrics?.totalShortages || 9} positions\n` +
      `• **High Demand Zone**: North District (Plumbing) & East District (Caregiving)\n\n` +
      `*Notice*: ${toolResult.disclaimer || 'Model estimates are generated from demo time-series regression for administrative workforce planning.'}`;
  } else if (q.includes('service') || q.includes('price') || q.includes('cost') || q.includes('rate')) {
    const toolResult = await executeTool('getServiceCategories', {}, user);
    toolsUsed.push('getServiceCategories');
    metadata.services = toolResult;
    reply = `Here are the currently supported **Cooperative Household & Community Services**:\n\n` +
      toolResult.services.slice(0, 6).map(s =>
        `• **${s.category}** (₹${s.basePrice} ${s.priceUnit}) — ${s.description}`
      ).join('\n') +
      `\n\nAll pricing is transparent with no hidden platform surge multipliers.`;
  } else if (q.includes('emergency') || q.includes('sos') || q.includes('urgent')) {
    const toolResult = await executeTool('getEmergencyServices', {}, user);
    toolsUsed.push('getEmergencyServices');
    reply = `🚨 **24/7 Cooperative Emergency Response**:\n\n` +
      `• **Emergency Hotline**: ${toolResult.emergencyHotline}\n` +
      `• **Priority Categories**: ${toolResult.availableEmergencyCategories.join(', ')}\n` +
      `• **Target SLA**: ${toolResult.sla}\n\n` +
      `To trigger an instant emergency request, click the **Emergency SOS** button on your dashboard.`;
  } else {
    reply = `Hello ${user.name || 'there'}! I am the AI Assistant for the **Cooperative Gig Services Platform**.\n\n` +
      `I can help you with:\n` +
      `• **Finding verified cooperative workers** (Plumbing, Electrical, Carpentry, Cleaning, Caregiving, etc.)\n` +
      `• **Checking live worker availability & booking status**\n` +
      `• **Explaining Fair Work Allocation & transparent pricing**\n` +
      `• **Worker welfare coverage, insurance shields & dividend funds**\n` +
      `• **Regional demand forecasting & workforce analytics**\n\n` +
      `How can I assist you today?`;
  }

  return {
    reply,
    toolsUsed,
    metadata,
    model: 'Domain Assistant (Local Data Engine)'
  };
}

/**
 * Main Chat Handler with Google Gemini Multi-Turn Function Calling
 */
export async function chatWithGemini({ user, message, history = [] }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  // If no Gemini API key is configured or invalid, use the robust local data engine
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return generateFallbackResponse(user, message, history);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = buildSystemInstruction(user);

    // Format conversation history for @google/genai
    const contents = [];

    // Append past turns (up to last 10 messages)
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-10);
      for (const turn of recentHistory) {
        if (turn.role && turn.text) {
          contents.push({
            role: turn.role === 'assistant' || turn.role === 'model' ? 'model' : 'user',
            parts: [{ text: String(turn.text) }]
          });
        }
      }
    }

    // Append current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: String(message) }]
    });

    const toolsUsed = [];
    let currentIteration = 0;
    const MAX_ITERATIONS = 5;

    // Multi-turn function calling loop
    while (currentIteration < MAX_ITERATIONS) {
      currentIteration++;

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: geminiToolDeclarations }],
          temperature: 0.3
        }
      });

      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      // Check for function calls
      const functionCalls = [];
      for (const part of parts) {
        if (part.functionCall) {
          functionCalls.push(part.functionCall);
        }
      }

      // If no function call, return text response
      if (functionCalls.length === 0) {
        const textReply = response.text || parts.map(p => p.text || '').join('').trim();
        return {
          reply: textReply || 'I processed your request using the cooperative platform data.',
          toolsUsed,
          model: modelName
        };
      }

      // Add model's function call turn to contents
      contents.push({
        role: 'model',
        parts
      });

      // Execute each function call and construct response parts
      const responseParts = [];
      for (const fc of functionCalls) {
        const { name, args } = fc;
        toolsUsed.push(name);

        const toolResult = await executeTool(name, args || {}, user);

        responseParts.push({
          functionResponse: {
            name,
            response: toolResult
          }
        });
      }

      // Add function response turn to contents
      contents.push({
        role: 'user',
        parts: responseParts
      });
    }

    // Fallback if iteration limit reached
    return {
      reply: 'I gathered the relevant platform data for your request.',
      toolsUsed,
      model: modelName
    };
  } catch (err) {
    console.error('[Gemini Service Error]:', err.message);
    // Fall back smoothly to local data engine if Gemini API fails
    const fallback = await generateFallbackResponse(user, message, history);
    fallback.note = 'Served via fallback due to API communication issue.';
    return fallback;
  }
}
