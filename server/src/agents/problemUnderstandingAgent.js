import { multimodalAIService } from '../services/multimodalAIService.js';

/**
 * Agent 1: Problem Understanding & Conversational Intent Agent (200-Scenario Generalized Engine)
 * Classifies customer input into GREETING, GENERAL_QUESTION, INQUIRY, HUMAN_ESCALATION, or structured RETURN claim intent.
 * Handles informal phrasing, Hinglish, typos, short messages, and multi-turn intents.
 */
export const runProblemUnderstandingAgent = async (customerMessage = '', returnReason = null) => {
  const safeMessage = typeof customerMessage === 'string' ? customerMessage : String(customerMessage || '');
  const msg = safeMessage.trim().toLowerCase();
  const safeReason = typeof returnReason === 'string' ? returnReason.toUpperCase() : null;

  // 1. GREETINGS GENERALIZATION
  const GREETINGS = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'thanks', 'thank you', 'yo', 'namaste', 'greetings', 'hi there', 'hello assistant'];
  const isExactGreeting = GREETINGS.some((g) => msg === g || msg === `${g}!` || msg === `${g}.`);
  if (isExactGreeting) {
    return {
      status: 'completed',
      summary: 'Customer greeted assistant. Return flow not initiated.',
      data: {
        intent: 'GREETING',
        category: 'GREETING',
        resolutionPreference: 'UNKNOWN',
        returnReason: null,
        mainIssue: 'Greeting message',
        customerRequest: 'Casual interaction',
        urgency: 'LOW',
        missingInformation: [],
      },
    };
  }

  // 2. HUMAN ESCALATION REQUEST GENERALIZATION
  const HUMAN_REQUESTS = ['human', 'speak to human', 'talk to agent', 'human agent', 'representative', 'customer support agent', 'real person', 'talk to human', 'escalate'];
  if (HUMAN_REQUESTS.some((h) => msg.includes(h))) {
    return {
      status: 'completed',
      summary: 'Customer requested human specialist support.',
      data: {
        intent: 'HUMAN_ESCALATION',
        category: 'HUMAN_ESCALATION',
        resolutionPreference: 'HUMAN_REVIEW',
        returnReason: null,
        mainIssue: safeMessage,
        customerRequest: 'Human specialist assignment',
        urgency: 'HIGH',
        missingInformation: [],
      },
    };
  }

  // 3. STATUS & INQUIRY GENERALIZATION (Pickup, Refund timing, Tracking, Status, Return ID, Policy)
  const INQUIRIES = [
    { key: 'PICKUP', phrases: ['when pickup', 'pickup timing', 'how pickup works', 'pickup date', 'who will pick', 'when will pickup'] },
    { key: 'REFUND_TIMING', phrases: ['how long refund', 'refund timing', 'when will i get money', 'refund credit', 'refunds take', 'how long do refunds'] },
    { key: 'REPLACEMENT_TIMING', phrases: ['when replacement ship', 'replacement dispatch', 'tracking replacement', 'when will replacement'] },
    { key: 'STATUS', phrases: ['return status', 'status of return', 'return id status', 'is my return approved', 'check return'] },
    { key: 'POLICY', phrases: ['how do returns work', 'how does the return process work', 'return process', 'return policy', 'can i return', 'return window', '30 day return'] },
  ];

  for (const inq of INQUIRIES) {
    if (inq.phrases.some((p) => msg.includes(p))) {
      return {
        status: 'completed',
        summary: `Customer asked inquiry about ${inq.key}.`,
        data: {
          intent: 'GENERAL_QUESTION',
          category: 'GENERAL_QUESTION',
          inquiryType: inq.key,
          resolutionPreference: 'UNKNOWN',
          returnReason: null,
          mainIssue: safeMessage,
          customerRequest: `Inquiry regarding ${inq.key}`,
          urgency: 'LOW',
          missingInformation: [],
        },
      };
    }
  }

  // AI Multimodal Text Analysis for 200-Scenario NLU Generalization
  const prompt = `Analyze this e-commerce query across 200 real-world return scenarios and return JSON:
Customer Query: "${safeMessage}"
Structured Reason Code: "${safeReason || 'NOT_PROVIDED'}"

JSON Schema:
{
  "intent": "RETURN" | "GENERAL_QUESTION" | "GREETING" | "HUMAN_ESCALATION",
  "category": "DAMAGED_PRODUCT" | "RETURN_REFUND" | "WRONG_PRODUCT" | "MISSING_ITEM" | "NOT_WORKING" | "NOT_AS_DESCRIBED" | "DONT_WANT" | "GREETING" | "GENERAL_QUESTION" | "OTHER",
  "issueType": "PRODUCT_DAMAGED" | "WRONG_PRODUCT" | "NOT_WORKING" | "MISSING_ITEM" | "NOT_AS_DESCRIBED" | "DONT_WANT" | "WRONG_SIZE" | "WRONG_COLOR" | "ACCIDENTAL" | "GIFT" | "OTHER",
  "specificIssue": string,
  "resolutionPreference": "REFUND" | "REPLACEMENT" | "UNKNOWN",
  "mainIssue": string,
  "customerRequest": string,
  "urgency": "LOW" | "MEDIUM" | "HIGH",
  "missingInformation": string[]
}`;

  const aiResult = await multimodalAIService.analyzeText(
    prompt,
    'You are a senior e-commerce return intent classifier specializing in 200 real-world customer return scenarios.'
  );

  if (aiResult && aiResult.category) {
    return {
      status: 'completed',
      summary: `Identified issue category as ${aiResult.category} (${aiResult.intent || 'RETURN'} intent).`,
      data: {
        ...aiResult,
        returnReason: safeReason || (aiResult.category !== 'OTHER' ? aiResult.category : null),
      },
    };
  }

  // Deterministic Fallback NLU Generalization Engine
  let category = 'OTHER';
  let intent = 'RETURN';
  let issueType = 'OTHER';
  let preference = 'UNKNOWN';
  let request = 'Assistance required';
  let urgency = 'MEDIUM';

  // Resolution Preference Extraction
  if (msg.includes('refund') || msg.includes('money back') || msg.includes('paise wapas') || msg.includes('credit')) {
    preference = 'REFUND';
  } else if (msg.includes('replacement') || msg.includes('another one') || msg.includes('exchange') || msg.includes('new one') || msg.includes('dobara bhejo')) {
    preference = 'REPLACEMENT';
  }

  // Intent Classification (Hinglish & Natural Language Generalization)
  if (safeReason === 'PRODUCT_DAMAGED' || msg.includes('damage') || msg.includes('broken') || msg.includes('crack') || msg.includes('shatter') || msg.includes('tuta') || msg.includes('bent')) {
    category = 'DAMAGED_PRODUCT';
    issueType = 'PRODUCT_DAMAGED';
    intent = 'RETURN';
    request = preference === 'REFUND' ? 'Refund request for damaged item' : 'Replacement for damaged item';
  } else if (safeReason === 'WRONG_PRODUCT' || msg.includes('wrong') || msg.includes('incorrect') || msg.includes('galat') || msg.includes('wrong color') || msg.includes('wrong size')) {
    category = 'WRONG_PRODUCT';
    issueType = msg.includes('size') ? 'WRONG_SIZE' : msg.includes('color') ? 'WRONG_COLOR' : 'WRONG_PRODUCT';
    intent = 'RETURN';
    request = 'Item exchange for wrong product';
  } else if (safeReason === 'MISSING_ITEM' || msg.includes('missing') || msg.includes('absent') || msg.includes('charger missing') || msg.includes('accessory missing') || msg.includes('empty box')) {
    category = 'MISSING_ITEM';
    issueType = 'MISSING_ITEM';
    intent = 'RETURN';
    request = 'Dispatch missing accessory or item';
  } else if (safeReason === 'NOT_WORKING' || msg.includes('not working') || msg.includes('buzzing') || msg.includes('defective') || msg.includes('noise') || msg.includes('kam nahi kar raha') || msg.includes('won\'t turn on') || msg.includes('stopped working')) {
    category = 'NOT_WORKING';
    issueType = 'NOT_WORKING';
    intent = 'RETURN';
    request = 'Technical replacement or refund';
  } else if (safeReason === 'DONT_WANT' || msg.includes('dont want') || msg.includes("don't want") || msg.includes('changed my mind') || msg.includes('dislike') || msg.includes('accident') || msg.includes('gift')) {
    category = 'DONT_WANT';
    issueType = 'DONT_WANT';
    intent = 'RETURN';
    request = 'Change of mind return';
  } else if (msg.includes('return') || msg.includes('send back') || msg.includes('wapas')) {
    category = 'RETURN_REFUND';
    intent = 'RETURN';
    request = 'Return request';
  }

  return {
    status: 'completed',
    summary: `Identified issue category as ${category}.`,
    data: {
      intent,
      category,
      issueType,
      resolutionPreference: preference,
      returnReason: safeReason || (category !== 'OTHER' ? category : null),
      mainIssue: safeMessage,
      customerRequest: request,
      urgency,
      missingInformation: [],
    },
  };
};
