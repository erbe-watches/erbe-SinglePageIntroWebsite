/**
 * ERBE — Legacy of Time
 * Intent Classification & Contact Extraction Engine
 */

const config = require('./config');

/**
 * Normalizes text for Urdu/English regex matching
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^\w\s\u0600-\u06FF?+]/g, ' ')
    .trim();
}

/**
 * Normalizes a Pakistani phone number into +92XXXXXXXXXX format
 */
function normalizePakistaniPhone(rawPhone) {
  if (!rawPhone) return null;
  // Remove spaces, hyphens, parentheses
  let digits = rawPhone.replace(/[\s\-\(\)\+]/g, '');

  // If starts with 92, ensure +92
  if (digits.startsWith('92') && digits.length === 12) {
    return '+' + digits;
  }
  // If starts with 03 (e.g. 03071771829)
  if (digits.startsWith('03') && digits.length === 11) {
    return '+92' + digits.substring(1);
  }
  // If starts with 3 (e.g. 3071771829)
  if (digits.startsWith('3') && digits.length === 10) {
    return '+92' + digits;
  }

  return rawPhone.trim();
}

/**
 * Analyzes a Facebook comment and scores its buying intent
 * @param {string} commentText
 * @returns {object} Classification result
 */
function classifyComment(commentText) {
  const clean = normalizeText(commentText);
  if (!clean || clean.length < 2) {
    return {
      isIntentLead: false,
      score: 0,
      topCase: null,
      matchedCases: [],
      reason: 'Empty or too short'
    };
  }

  let matchedCases = [];
  let maxWeight = 0;
  let topCase = null;
  let allMatchedKeywords = [];

  for (const [caseKey, caseDef] of Object.entries(config.intentCases)) {
    const hits = [];
    for (const kw of caseDef.keywords) {
      // Word boundary or substring check
      const regex = new RegExp(`(^|\\s|[?.,!])${kw}($|\\s|[?.,!])`, 'i');
      if (regex.test(clean) || clean.includes(kw)) {
        hits.push(kw);
        allMatchedKeywords.push(kw);
      }
    }

    if (hits.length > 0) {
      matchedCases.push({
        caseId: caseDef.id,
        name: caseDef.name,
        weight: caseDef.weight,
        matchedKeywords: hits
      });

      if (caseDef.weight > maxWeight) {
        maxWeight = caseDef.weight;
        topCase = caseDef.name;
      }
    }
  }

  // Calculate composite score (base max weight + bonus for multiple triggers)
  let score = maxWeight;
  if (matchedCases.length > 1) {
    score = Math.min(100, score + (matchedCases.length - 1) * 5);
  }

  // Filter out low intent / generic chatter
  const isIntentLead = score >= 70 && matchedCases.length > 0;

  return {
    isIntentLead,
    score,
    topCase,
    matchedCases,
    matchedKeywords: Array.from(new Set(allMatchedKeywords)),
    reason: isIntentLead ? `High Buying Intent (${topCase}): ${allMatchedKeywords.join(', ')}` : 'Low / Non-commercial intent'
  };
}

/**
 * Extracts public Pakistani phone numbers and emails from text/HTML
 * @param {string} textOrHtml 
 * @returns {object} Contact extraction result
 */
function extractContacts(textOrHtml) {
  if (!textOrHtml) {
    return { phones: [], emails: [], primaryPhone: null, primaryEmail: null };
  }

  const text = String(textOrHtml);

  // 1. Extract Phones
  const phoneMatches = text.match(config.regex.pakistanPhone) || [];
  const normalizedPhones = Array.from(
    new Set(phoneMatches.map(p => normalizePakistaniPhone(p)).filter(Boolean))
  );

  // 2. Extract Emails
  const emailMatches = text.match(config.regex.email) || [];
  const validEmails = Array.from(
    new Set(emailMatches.map(e => e.toLowerCase().trim()).filter(e => !e.endsWith('.png') && !e.endsWith('.jpg')))
  );

  return {
    phones: normalizedPhones,
    emails: validEmails,
    primaryPhone: normalizedPhones.length > 0 ? normalizedPhones[0] : null,
    primaryEmail: validEmails.length > 0 ? validEmails[0] : null
  };
}

/**
 * Determines lead tier based on extracted contact data
 */
function determineLeadTier(contacts) {
  if (contacts && (contacts.primaryPhone || contacts.primaryEmail)) {
    return 'gold'; // Has Phone or Email
  }
  return 'silver'; // Profile only, reachable via Messenger DM
}

module.exports = {
  classifyComment,
  extractContacts,
  determineLeadTier,
  normalizePakistaniPhone,
  normalizeText
};
