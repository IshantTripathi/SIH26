import { chatWithGemini } from '../services/geminiService.js';
import { ROLES } from '../config/constants.js';

/**
 * AI Chat Controller Handler
 * Validates input, passes safe user context, and invokes Gemini Assistant.
 */
export async function handleAiChat(req, res) {
  try {
    const { message, history } = req.body;

    // 1. Input Validation
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A non-empty message string is required.'
      });
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.'
      });
    }

    if (trimmed.length > 1200) {
      return res.status(400).json({
        success: false,
        message: 'Message exceeds maximum length of 1200 characters. Please provide a more concise query.'
      });
    }

    // 2. Extract safe authenticated user context (never leak sensitive auth data)
    const user = req.user || { role: ROLES.CUSTOMER, name: 'Guest' };
    const safeUser = {
      id: user.id,
      name: user.name,
      role: user.role,
      customerType: user.customerType,
      workerId: user.workerId,
      societyId: user.societyId,
      federationId: user.federationId,
      location: user.location
    };

    // 3. Call Gemini Service
    const result = await chatWithGemini({
      user: safeUser,
      message: trimmed,
      history: Array.isArray(history) ? history : []
    });

    return res.json({
      success: true,
      reply: result.reply,
      toolsUsed: result.toolsUsed || [],
      model: result.model || 'gemini-3.7-flash',
      metadata: result.metadata || {}
    });
  } catch (err) {
    console.error('[AI Controller Error]:', err.message);
    return res.status(500).json({
      success: false,
      reply: 'The AI assistant is temporarily unavailable. Please try again in a moment.',
      message: 'Internal AI processing notice'
    });
  }
}

/**
 * Returns contextual quick prompts based on authenticated role
 */
export function getRoleSuggestions(req, res) {
  const role = req.user?.role || ROLES.CUSTOMER;

  const suggestionsMap = {
    [ROLES.CUSTOMER]: [
      'Find a plumber near me',
      'How do I book an electrician?',
      'Show my active jobs',
      'What does worker verification mean?',
      'I need emergency plumbing service',
      'Explain transparent pricing & 95% worker payout'
    ],
    [ROLES.WORKER]: [
      'Show my assigned jobs',
      'How does fair allocation work?',
      'What is my current workload?',
      'Explain my welfare status & insurance shield',
      'What is the quarterly dividend surplus pool?'
    ],
    [ROLES.SOCIETY_ADMIN]: [
      'Show cooperative worker statistics',
      'What is our workforce utilization & workload balance?',
      'Show active jobs and recent completions',
      'Summarize society member welfare contributions'
    ],
    [ROLES.FEDERATION_ADMIN]: [
      'Show regional demand forecast',
      'Which district has workforce skill shortages?',
      'Explain cooperative dividend surplus pool',
      'How is inter-society work distributed?'
    ],
    [ROLES.PLATFORM_ADMIN]: [
      'Show overall system activity',
      'Summarize active workers and demand metrics',
      'Explain fair work allocation audit log'
    ]
  };

  const suggestions = suggestionsMap[role] || suggestionsMap[ROLES.CUSTOMER];

  return res.json({
    success: true,
    role,
    suggestions
  });
}

/**
 * Returns AI status and configuration
 */
export function getAiStatus(req, res) {
  const hasKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  const configuredModel = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

  return res.json({
    success: true,
    status: 'OPERATIONAL',
    service: 'SIH26089 Cooperative Platform AI Assistant',
    model: configuredModel,
    liveGeminiActive: hasKey,
    mode: hasKey ? 'Google Gemini Flash (Cloud)' : 'Domain Data Engine (Dual-Mode Local)',
    capabilities: [
      'Role-Aware System Instructions',
      'Read-Only Function Calling (Live DB Tools)',
      'Fair Work Allocation Rationale',
      'Demand Forecasting Explanation',
      'Worker Welfare & Dividend Lookup',
      'Strict Privacy & Rate Limiting'
    ]
  });
}
