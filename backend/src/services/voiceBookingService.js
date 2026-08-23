import { store } from '../data/store.js';
import { classifyProblemDescription } from './problemClassifier.js';
import { rankWorkersForJob } from './fairAllocationEngine.js';

/**
 * AI Voice-First Conversational Booking Engine
 * Multi-turn guided conversation that walks customer through booking
 * using natural language in Hindi/English.
 */

const CONVERSATION_STATES = {
  INITIAL: 'INITIAL',
  CLASSIFYING: 'CLASSIFYING',
  ASKING_URGENCY: 'ASKING_URGENCY',
  ASKING_LOCATION: 'ASKING_LOCATION',
  ASKING_SCHEDULE: 'ASKING_SCHEDULE',
  ASKING_INSTITUTION: 'ASKING_INSTITUTION',
  CONFIRMING: 'CONFIRMING',
  BOOKED: 'BOOKED'
};

const HINDI_KEYWORDS = {
  greetings: ['namaste', 'nमस्ते', 'hello', 'hi', 'hey'],
  confirm: ['haan', 'हाँ', 'ji', 'ठीक', 'theek', 'yes', 'ok', 'okay', 'sure'],
  deny: ['nahi', 'नहीं', 'no', 'nahin'],
  emergency: ['urgent', 'तुरंत', 'turant', 'abhi', 'अभी', 'emergency', 'आपातकाल', 'jaldi', 'जल्दी'],
  normal: ['baad mein', 'बाद में', 'later', 'scheduled', 'kal', 'कल', 'tomorrow'],
  location: ['address', 'पता', 'pata', 'location', 'स्थान', 'yahan', 'यहाँ', 'wahan', 'वहाँ'],
  timing: ['subah', 'सुबह', 'morning', 'dopahar', 'दोपहर', 'afternoon', 'shaam', 'शाम', 'evening'],
  plumbing: ['paani', 'पानी', 'tap', 'nalka', 'नलका', 'leak', 'rishav', 'रिसाव', 'pipe', 'पाइप', 'plumbing'],
  electrical: ['bijli', 'बिजली', 'light', 'fan', 'switch', 'wiring', 'electrical', 'short circuit'],
  cleaning: ['saaf', 'साफ', 'clean', 'safai', 'सफाई', 'painting', 'paint', 'rang'],
  carpentry: ['furniture', 'ताला', 'lock', 'door', 'window', 'wood', 'carpenter'],
  caregiving: ['dekhbhaal', 'देखभाल', 'care', 'buddha', 'बुज़ुर्ग', 'patient', 'nurse'],
  driving: ['driver', 'gaadi', 'गाड़ी', 'car', 'ride', 'transport'],
  gardening: ['garden', 'बगीचा', 'paudhe', 'पौधे', 'plant', 'landscaping']
};

function detectLanguage(text = '') {
  const hindiPattern = /[\u0900-\u097F]/;
  const hindiWordCount = (text.match(/[\u0900-\u097F]+/g) || []).length;
  const totalWords = text.split(/\s+/).length;
  if (hindiPattern.test(text) || hindiWordCount > totalWords * 0.3) return 'hi';
  return 'en';
}

function extractIntentFromVoice(text = '') {
  const normalized = text.toLowerCase().trim();
  const detectedLang = detectLanguage(normalized);

  // Detect service category from voice input
  let serviceCategory = null;
  let matchedDomain = null;

  for (const [domain, keywords] of Object.entries(HINDI_KEYWORDS)) {
    if (domain === 'greetings' || domain === 'confirm' || domain === 'deny' || domain === 'emergency' || domain === 'normal' || domain === 'location' || domain === 'timing') continue;
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        serviceCategory = domain === 'caregiving' ? 'Caregiving' : domain === 'driving' ? 'Driving' : domain === 'gardening' ? 'Gardening' : domain.charAt(0).toUpperCase() + domain.slice(1);
        matchedDomain = domain;
        break;
      }
    }
    if (serviceCategory) break;
  }

  // Detect urgency
  const isEmergency = HINDI_KEYWORDS.emergency.some(kw => normalized.includes(kw));
  const isScheduled = HINDI_KEYWORDS.normal.some(kw => normalized.includes(kw));

  // Detect time preferences
  let preferredTime = null;
  for (const kw of HINDI_KEYWORDS.timing) {
    if (normalized.includes(kw)) {
      if (['subah', 'सुबह', 'morning'].includes(kw)) preferredTime = 'Morning (9 AM - 12 PM)';
      else if (['dopahar', 'दोपहर', 'afternoon'].includes(kw)) preferredTime = 'Afternoon (12 PM - 4 PM)';
      else if (['shaam', 'शाम', 'evening'].includes(kw)) preferredTime = 'Evening (4 PM - 8 PM)';
      break;
    }
  }

  // Use problem classifier for detailed classification
  let classification = null;
  if (serviceCategory || normalized.length > 5) {
    classification = classifyProblemDescription(text);
  }

  return {
    detectedLanguage: detectedLang,
    serviceCategory: classification?.serviceCategory || serviceCategory || 'General Maintenance',
    serviceTitle: classification?.serviceTitle || 'General Service',
    basePrice: classification?.basePrice || 500,
    confidence: classification?.confidence || 0.6,
    isEmergency,
    isScheduled: isScheduled || !isEmergency,
    preferredTime,
    rawInput: text
  };
}

function generateConversationResponse(state, intent, language = 'en') {
  const responses = {
    en: {
      INITIAL: {
        greeting: "Namaste! I'm your Sahakar Booking Assistant. Tell me what service you need — describe the problem in your own words.",
        followUp: "I understood you need help with {service}. Can you tell me — is this urgent or can it be scheduled for later?"
      },
      ASKING_URGENCY: {
        emergency: "I understand this is urgent! I'll broadcast an emergency request to all nearby verified workers right away. What is your address/location?",
        normal: "Got it — this can be scheduled. When would you like the service? Morning, afternoon, or evening?",
        confirm: "Perfect. I'll book this for {time}. What is your service address?"
      },
      ASKING_LOCATION: {
        ask: "Please share your address or area name so I can match you with the nearest cooperative worker.",
        confirm: "Got it — {location}. Let me confirm the details..."
      },
      ASKING_SCHEDULE: {
        ask: "When would you like the service? You can say morning, afternoon, evening, or tomorrow.",
        confirm: "Service scheduled for {time}."
      },
      CONFIRMING: {
        summary: "Here's your booking summary:\n• Service: {service}\n• Urgency: {urgency}\n• Time: {time}\n• Address: {location}\n• Estimated Price: ₹{price}\n\nShall I confirm this booking? Say 'yes' or 'confirm' to proceed.",
        booked: "Your booking is confirmed! Job Code: {jobCode}. A verified cooperative worker will be assigned shortly. You'll receive an OTP for service completion. Dhanyavaad!"
      }
    },
    hi: {
      INITIAL: {
        greeting: "नमस्ते! मैं आपकी सहकार बुकिंग सहायक हूँ। बताइए आपको किस सेवा की ज़रूरत है — अपनी समस्या अपने शब्दों में बताएं।",
        followUp: "मैंने समझ लिया आपको {service} की ज़रूरत है। क्या बता सकते हैं — यह तुरंत ज़रूरी है या बाद में शेड्यूल कर सकते हैं?"
      },
      ASKING_URGENCY: {
        emergency: "समझ गया, यह तुरंत ज़रूरी है! मैं तुरंत सभी निकटतम सत्यापित श्रमिकों को आपातकालीन प्रसारण भेज रहा हूँ। आपका पता क्या है?",
        normal: "ठीक है — इसे शेड्यूल किया जा सकता है। आप सेवा कब चाहते हैं? सुबह, दोपहर, या शाम?",
        confirm: "बहुत अच्छा। मैं इसे {time} के लिए बुक कर रहा हूँ। आपका सेवा पता क्या है?"
      },
      ASKING_LOCATION: {
        ask: "कृपया अपना पता या क्षेत्र का नाम बताएं ताकि मैं निकटतम सहकारी श्रमिक से मैच कर सकूँ।",
        confirm: "समझ गया — {location}। मैं विवरण की पुष्टि कर रहा हूँ..."
      },
      ASKING_SCHEDULE: {
        ask: "आप सेवा कब चाहते हैं? आप सुबह, दोपहर, शाम, या कल कह सकते हैं।",
        confirm: "सेवा {time} के लिए निर्धारित।"
      },
      CONFIRMING: {
        summary: "आपकी बुकिंग का सारांश:\n• सेवा: {service}\n• प्राथमिकता: {urgency}\n• समय: {time}\n• पता: {location}\n• अनुमानित मूल्य: ₹{price}\n\nक्या मैं इस बुकिंग की पुष्टि करूँ? 'हाँ' या 'confirm' कहें।",
        booked: "आपकी बुकिंग पुष्टि हो गई! जॉब कोड: {jobCode}. एक सत्यापित सहकारी श्रमिक जल्द ही नियुक्त होगा। सेवा पूर्णता के लिए आपको OTP मिलेगा। धन्यवाद!"
      }
    }
  };

  const lang = responses[language] || responses.en;
  return lang[state] || lang.INITIAL;
}

export function startVoiceBooking(customerId) {
  const sessionId = `VOICE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const session = {
    id: sessionId,
    customerId,
    state: CONVERSATION_STATES.INITIAL,
    intent: {},
    collectedData: {
      serviceCategory: null,
      urgency: null,
      location: null,
      scheduledDate: null,
      scheduledTime: null,
      customerType: 'Household',
      institutionName: null
    },
    messages: [],
    startedAt: new Date().toISOString()
  };

  store.create('voiceBookingSessions', session);

  const lang = 'en';
  const response = generateConversationResponse(CONVERSATION_STATES.INITIAL, {}, lang);

  return {
    sessionId,
    state: CONVERSATION_STATES.INITIAL,
    message: response.greeting,
    quickReplies: [
      { text: 'Plumbing issue', payload: 'plumbing leak' },
      { text: 'Electrical problem', payload: 'electrical fan not working' },
      { text: 'Home cleaning', payload: 'cleaning service needed' },
      { text: 'Emergency!', payload: 'urgent emergency help' }
    ]
  };
}

export function processVoiceInput(sessionId, text) {
  const session = store.findById('voiceBookingSessions', sessionId);
  if (!session) {
    return { error: 'Session not found. Please start a new booking.' };
  }

  const intent = extractIntentFromVoice(text);
  const lang = intent.detectedLanguage;
  let nextState = session.state;
  let responseMessage = '';
  let quickReplies = [];
  let jobCreated = null;

  switch (session.state) {
    case CONVERSATION_STATES.INITIAL: {
      session.collectedData.serviceCategory = intent.serviceCategory;
      session.intent = intent;

      if (intent.isEmergency) {
        session.collectedData.urgency = 'Emergency';
        nextState = CONVERSATION_STATES.ASKING_LOCATION;
        const resp = generateConversationResponse(CONVERSATION_STATES.ASKING_URGENCY, intent, lang);
        responseMessage = resp.emergency;
        quickReplies = [
          { text: 'Share my location', payload: 'current location' },
          { text: 'Type address manually', payload: 'address input' }
        ];
      } else {
        nextState = CONVERSATION_STATES.ASKING_URGENCY;
        const resp = generateConversationResponse(CONVERSATION_STATES.INITIAL, intent, lang);
        responseMessage = resp.followUp.replace('{service}', intent.serviceTitle);
        quickReplies = [
          { text: 'Urgent / Today', payload: 'urgent today' },
          { text: 'Schedule for later', payload: 'schedule later' },
          { text: 'Tomorrow morning', payload: 'tomorrow morning' }
        ];
      }
      break;
    }

    case CONVERSATION_STATES.ASKING_URGENCY: {
      if (intent.isEmergency || HINDI_KEYWORDS.emergency.some(kw => text.toLowerCase().includes(kw))) {
        session.collectedData.urgency = 'Emergency';
      } else {
        session.collectedData.urgency = 'Normal';
      }

      if (intent.preferredTime) {
        session.collectedData.scheduledTime = intent.preferredTime;
      }

      nextState = CONVERSATION_STATES.ASKING_LOCATION;
      const resp = generateConversationResponse(CONVERSATION_STATES.ASKING_LOCATION, intent, lang);
      responseMessage = resp.ask;
      quickReplies = [
        { text: 'Use my current location', payload: 'current location' },
        { text: 'I\'ll type the address', payload: 'manual address' }
      ];
      break;
    }

    case CONVERSATION_STATES.ASKING_LOCATION: {
      session.collectedData.location = text;
      nextState = CONVERSATION_STATES.CONFIRMING;
      const resp = generateConversationResponse(CONVERSATION_STATES.ASKING_LOCATION, intent, lang);
      responseMessage = resp.confirm.replace('{location}', text);

      const pricing = store.findOne('services', { category: session.collectedData.serviceCategory });
      const estimatedPrice = pricing?.basePrice || 500;

      const confirmResp = generateConversationResponse(CONVERSATION_STATES.CONFIRMING, intent, lang);
      responseMessage += '\n\n' + confirmResp.summary
        .replace('{service}', session.collectedData.serviceCategory)
        .replace('{urgency}', session.collectedData.urgency)
        .replace('{time}', session.collectedData.scheduledTime || 'As soon as possible')
        .replace('{location}', session.collectedData.location)
        .replace('{price}', estimatedPrice);

      quickReplies = [
        { text: '✅ Confirm booking', payload: 'confirm booking' },
        { text: '❌ Cancel', payload: 'cancel' },
        { text: '✏️ Change time', payload: 'change time' }
      ];
      break;
    }

    case CONVERSATION_STATES.CONFIRMING: {
      const isConfirm = HINDI_KEYWORDS.confirm.some(kw => text.toLowerCase().includes(kw));
      const isDeny = HINDI_KEYWORDS.deny.some(kw => text.toLowerCase().includes(kw));

      if (isDeny) {
        nextState = CONVERSATION_STATES.INITIAL;
        const lang2 = detectLanguage(text);
        const resp = generateConversationResponse(CONVERSATION_STATES.INITIAL, {}, lang2);
        responseMessage = "No problem! Let's start over. " + resp.greeting;
        quickReplies = [
          { text: 'Plumbing issue', payload: 'plumbing leak' },
          { text: 'Electrical problem', payload: 'electrical fan not working' },
          { text: 'Home cleaning', payload: 'cleaning service needed' }
        ];
        break;
      }

      if (!isConfirm) {
        responseMessage = "Please say 'yes' or 'confirm' to proceed, or 'no' to start over.";
        quickReplies = [
          { text: '✅ Yes, confirm', payload: 'confirm booking' },
          { text: '❌ No, cancel', payload: 'cancel' }
        ];
        break;
      }

      // Create the actual job
      const customer = store.findById('users', session.customerId);
      if (!customer) {
        responseMessage = "Error: Customer not found. Please login again.";
        break;
      }

      try {
        const services = store.getCollection('services');
        const matchedService = services.find(s => s.category === session.collectedData.serviceCategory);
        const basePrice = matchedService?.basePrice || 500;

        const societyId = 'SOC-DEMO-001';
        const society = store.findById('societies', societyId);
        const coopPercent = society?.coopContributionPercent ?? 4;
        const welfarePercent = society?.welfareFundPercent ?? 1;

        const grossAmount = basePrice;
        const coopContribution = Math.round((grossAmount * (coopPercent / 100)) * 10) / 10;
        const welfareDeduction = Math.round((grossAmount * (welfarePercent / 100)) * 10) / 10;
        const netWorkerEarnings = Math.round((grossAmount - coopContribution - welfareDeduction) * 10) / 10;

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const jobCode = `JOB-2026-${Math.floor(100 + Math.random() * 900)}`;

        // Find best worker
        const allocationResult = rankWorkersForJob({
          serviceCategory: session.collectedData.serviceCategory,
          urgency: session.collectedData.urgency,
          customerLocation: customer.location || { lat: 28.6140, lng: 77.2095 }
        });

        const recommended = allocationResult.recommendedWorker;
        let assignedWorker = null;
        if (recommended) {
          assignedWorker = store.findById('workers', recommended.workerId);
        }

        jobCreated = store.create('jobs', {
          code: jobCode,
          customerId: customer.id,
          customerName: customer.name,
          customerType: session.collectedData.customerType,
          institutionName: session.collectedData.institutionName,
          customerPhone: customer.mobile,
          customerAddress: session.collectedData.location,
          workerId: assignedWorker?.id || null,
          workerName: assignedWorker?.name || 'Matching in progress...',
          societyId,
          serviceId: `SERV-${session.collectedData.serviceCategory.toUpperCase().slice(0, 5)}`,
          serviceCategory: session.collectedData.serviceCategory,
          serviceTitle: matchedService?.title || `${session.collectedData.serviceCategory} Service`,
          problemDescription: `Voice booking: ${session.messages[0]?.text || 'Service requested via voice'}`,
          urgency: session.collectedData.urgency,
          status: assignedWorker ? 'OFFERED' : 'MATCHING',
          durationHours: 1,
          pricing: { grossAmount, coopContribution, welfareDeduction, netWorkerEarnings, coopPercent, welfarePercent },
          paymentStatus: 'PAYMENT_PENDING',
          otp,
          scheduledDate: session.collectedData.scheduledDate || new Date().toISOString().split('T')[0],
          scheduledTime: session.collectedData.scheduledTime || 'Immediately / On Demand',
          allocationReason: recommended?.recommendationReason || 'Voice booking allocation',
          bookingChannel: 'VOICE',
          statusHistory: [
            { status: 'REQUESTED', timestamp: new Date().toISOString() },
            { status: assignedWorker ? 'OFFERED' : 'MATCHING', timestamp: new Date().toISOString() }
          ]
        });

        store.logAudit({
          actorName: customer.name,
          actorRole: customer.role,
          action: 'VOICE_BOOKING_CREATED',
          module: 'Voice Booking',
          recordId: jobCreated.id,
          details: `Voice booking created for ${session.collectedData.serviceCategory} via ${lang === 'hi' ? 'Hindi' : 'English'} conversation`
        });

        nextState = CONVERSATION_STATES.BOOKED;
        const bookedResp = generateConversationResponse(CONVERSATION_STATES.CONFIRMING, intent, lang);
        responseMessage = bookedResp.booked.replace('{jobCode}', jobCode);

      } catch (err) {
        responseMessage = "Sorry, there was an error creating your booking. Please try again.";
        nextState = CONVERSATION_STATES.INITIAL;
      }
      break;
    }

    default:
      responseMessage = "Let's start fresh. Tell me what service you need.";
      nextState = CONVERSATION_STATES.INITIAL;
  }

  // Update session
  session.messages.push({ text, role: 'customer', timestamp: new Date().toISOString() });
  session.messages.push({ text: responseMessage, role: 'assistant', timestamp: new Date().toISOString() });
  session.state = nextState;

  store.findByIdAndUpdate('voiceBookingSessions', sessionId, {
    state: nextState,
    collectedData: session.collectedData,
    messages: session.messages,
    intent: session.intent
  });

  return {
    sessionId,
    state: nextState,
    message: responseMessage,
    quickReplies,
    job: jobCreated,
    collectedData: session.collectedData
  };
}

export function getVoiceBookingSession(sessionId) {
  return store.findById('voiceBookingSessions', sessionId);
}
