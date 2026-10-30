/**
 * ERBE — Legacy of Time
 * Automated Test Suite for Lead Hunter Intent Classifier & Contact Extractor
 */

const { classifyComment, extractContacts, determineLeadTier } = require('./classifier');

console.log('=====================================================');
console.log('🧪 RUNNING ERBE FACEBOOK LEAD HUNTER UNIT TESTS');
console.log('=====================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// -------------------------------------------------------------------
// 1. TEST 20 REALISTIC PAKISTANI COMMENTS
// -------------------------------------------------------------------
console.log('--- Test Suite 1: Intent Classification (20 Comments) ---');

const testCases = [
  { text: 'Bhai price kitni hai?', shouldBeLead: true, expectedCase: 'Price / Rate Inquiry' },
  { text: 'Karachi mein COD delivery available hai?', shouldBeLead: true, expectedCase: 'COD & Shipping Inquiry' },
  { text: 'Original hai ya master copy?', shouldBeLead: true, expectedCase: 'Specs & Authenticity Questions' },
  { text: 'Mujhe ye watch order karni hai WhatsApp number dein', shouldBeLead: true, expectedCase: 'High Purchase Urgency' },
  { text: 'Green dial available hai?', shouldBeLead: true, expectedCase: 'Color & Variant Availability' },
  { text: 'Nice pic bro', shouldBeLead: false },
  { text: '👍👍👍', shouldBeLead: false },
  { text: 'Bakwas watch hai time waste', shouldBeLead: false },
  { text: 'Rate please?', shouldBeLead: true, expectedCase: 'Price / Rate Inquiry' },
  { text: 'Delivery charges kitne hain Lahore ke?', shouldBeLead: true, expectedCase: 'COD & Shipping Inquiry' },
  { text: 'Automatic machine hai ya quartz?', shouldBeLead: true, expectedCase: 'Specs & Authenticity Questions' },
  { text: 'DM me details', shouldBeLead: true, expectedCase: 'High Purchase Urgency' },
  { text: 'Two tone gold available hai?', shouldBeLead: true, expectedCase: 'Color & Variant Availability' },
  { text: 'How much?', shouldBeLead: true, expectedCase: 'Price / Rate Inquiry' },
  { text: 'Cash on delivery hai parcel open check kr skte hn?', shouldBeLead: true, expectedCase: 'COD & Shipping Inquiry' },
  { text: 'Very beautiful styling', shouldBeLead: false },
  { text: 'Cost kya hai bhai?', shouldBeLead: true, expectedCase: 'Price / Rate Inquiry' },
  { text: 'Chahiye mujhe 03071771829', shouldBeLead: true, expectedCase: 'High Purchase Urgency' },
  { text: 'Hello friend', shouldBeLead: false },
  { text: 'Water resistant hai aur chain stainless steel hai?', shouldBeLead: true, expectedCase: 'Specs & Authenticity Questions' }
];

testCases.forEach((tc, idx) => {
  const result = classifyComment(tc.text);
  const matchedExpectation = result.isIntentLead === tc.shouldBeLead;
  assert(
    matchedExpectation,
    `Comment #${idx + 1} "${tc.text}" -> isIntentLead=${result.isIntentLead} (Score: ${result.score}, Top: ${result.topCase || 'None'})`
  );
});

// -------------------------------------------------------------------
// 2. TEST CONTACT EXTRACTION & TIERING
// -------------------------------------------------------------------
console.log('\n--- Test Suite 2: Contact Extraction & Lead Tiering ---');

const contactTests = [
  {
    raw: 'Contact: 03071771829 call or whatsapp me',
    expectedPhone: '+923071771829',
    expectedTier: 'gold'
  },
  {
    raw: 'My number is +92 300 1234567, email: test.customer@gmail.com',
    expectedPhone: '+923001234567',
    expectedEmail: 'test.customer@gmail.com',
    expectedTier: 'gold'
  },
  {
    raw: 'Profile About Section: Lives in Karachi, Pakistan. No contact listed.',
    expectedPhone: null,
    expectedTier: 'silver'
  },
  {
    raw: '0345-9876543 dial me',
    expectedPhone: '+923459876543',
    expectedTier: 'gold'
  }
];

contactTests.forEach((ct, idx) => {
  const contacts = extractContacts(ct.raw);
  const tier = determineLeadTier(contacts);
  
  if (ct.expectedPhone) {
    assert(contacts.primaryPhone === ct.expectedPhone, `Phone #${idx + 1}: Expected ${ct.expectedPhone}, got ${contacts.primaryPhone}`);
  }
  if (ct.expectedEmail) {
    assert(contacts.primaryEmail === ct.expectedEmail, `Email #${idx + 1}: Expected ${ct.expectedEmail}, got ${contacts.primaryEmail}`);
  }
  assert(tier === ct.expectedTier, `Tier #${idx + 1}: Expected ${ct.expectedTier}, got ${tier}`);
});

console.log('\n=====================================================');
console.log(`🏁 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round(passedTests/totalTests*100)}%)`);
console.log('=====================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
