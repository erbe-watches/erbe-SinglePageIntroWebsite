/**
 * ERBE — Legacy of Time
 * Facebook Lead Hunter & Outreach System Configuration
 * Tailored for Pakistan Luxury / Replica Watch Market
 */

const path = require('path');

module.exports = {
  // Brand Profile
  brand: {
    name: 'ERBE — Legacy of Time',
    ownerPhone: '923071771829', // 0307 1771829
    websiteUrl: 'https://erbewatches.erbewatches.workers.dev',
    collectionUrl: 'https://erbewatches.erbewatches.workers.dev/collection',
    rolexPrice: 1450,
    tubularPrice: 1950,
    voucherCode: 'ERBE-VIP500'
  },

  // Chrome & Browser Session
  browser: {
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    userDataDir: path.resolve(__dirname, '..', '.fb_session_profile'),
    headless: false, // Runs with visible window so user sees progress and avoids anti-bot
    viewport: { width: 1280, height: 800 }
  },

  // Safety & Anti-Ban Rate Limits
  safety: {
    minActionDelayMs: 30000, // 30 seconds minimum between DMs
    maxActionDelayMs: 60000, // 60 seconds maximum between DMs
    maxDailyDMs: 15,         // Max 15 Facebook Messenger DMs per 24 hours
    scrollDelayMs: 2500,     // Delay when scrolling comments
    maxCommentsPerPost: 50   // Max comments to scan per post
  },

  // Supabase Cloud Configuration
  supabase: {
    url: 'https://ajqgdcywqdpnrckghyax.supabase.co',
    anonKey: 'sb_publishable_lHvCsS1U7kPOPlPVLLSpmA_k8ZbPxKv'
  },

  // Daily 3 Rotating Discovery Queries for Pakistan (No Group Joining Required)
  dailyDiscovery: [
    {
      id: 'target-competitors',
      title: 'Target 1: Competitor Brand Public Posts',
      type: 'competitor',
      description: 'Public posts & reels from active Pakistani watch sellers',
      searchKeywords: ['watches in pakistan', 'rolex copy karachi', 'luxury watches lahore', 'sveston pakistan watches'],
      samplePages: [
        'https://www.facebook.com/watch',
        'https://www.facebook.com/search/posts/?q=rolex%20copy%20pakistan',
        'https://www.facebook.com/search/posts/?q=watches%20cash%20on%20delivery%20pakistan'
      ]
    },
    {
      id: 'target-public-groups',
      title: 'Target 2: Public Pakistani Watch Buy/Sell Feeds (No Join Required)',
      type: 'group_public_feed',
      description: 'Public posts from open buy/sell groups where users seek watches',
      searchKeywords: ['watches buy sell pakistan', 'first copy watches karachi', 'luxury timepieces lahore'],
      sampleGroupSearches: [
        'https://www.facebook.com/search/groups/?q=watches%20buy%20and%20sell%20pakistan',
        'https://www.facebook.com/search/groups/?q=luxury%20watches%20pakistan'
      ]
    },
    {
      id: 'target-viral-reels',
      title: 'Target 3: Viral Watch Video & Reel Showcases',
      type: 'viral_video',
      description: 'High-engagement video unboxings with comments asking for price',
      searchKeywords: ['rolex unboxing pakistan', 'mens watch review pakistan', 'watch collection pakistan'],
      sampleVideoSearches: [
        'https://www.facebook.com/search/videos/?q=rolex%20watch%20pakistan'
      ]
    }
  ],

  // Intent Case Dictionaries (Pakistani Buying Intent Patterns)
  intentCases: {
    caseA: {
      id: 'case_a_price',
      name: 'Price / Rate Inquiry',
      weight: 80,
      keywords: [
        'price', 'rate', 'cost', 'kitne ki', 'kitny ki', 'bhai kitne', 'dm price', 
        'how much', 'pkr', 'charges', 'kitna', 'qimat', 'kimat', 'prc', 'bhai price'
      ]
    },
    caseB: {
      id: 'case_b_cod_delivery',
      name: 'COD & Shipping Inquiry',
      weight: 90,
      keywords: [
        'cod', 'cash on delivery', 'delivery', 'delivery charges', 'parcel check', 
        'khol kar dekh', 'khol k check', 'karachi', 'lahore', 'islamabad', 'multan', 
        'peshawar', 'rawalpindi', 'faisalabad', 'gujranwala', 'quetta', 'deliver'
      ]
    },
    caseC: {
      id: 'case_c_specs_authenticity',
      name: 'Specs & Authenticity Questions',
      weight: 75,
      keywords: [
        'original', 'master copy', 'second copy', '1st copy', '2nd copy', 'copy', 
        'automatic', 'quartz', 'machine', 'waterproof', 'water resistant', 'chain', 
        'steel', 'warranty', 'guarantee', 'colour fade', 'metal'
      ]
    },
    caseD: {
      id: 'case_d_urgent_order',
      name: 'High Purchase Urgency',
      weight: 95,
      keywords: [
        'order', 'order karna', 'order krna', 'whatsapp number', 'contact number', 
        'interested', 'need this', 'chahiye', 'chahye', 'kahan se milegi', 'how to buy', 
        'book my order', 'dm me', 'inbox', 'available?', 'i want'
      ]
    },
    caseE: {
      id: 'case_e_variant_color',
      name: 'Color & Variant Availability',
      weight: 85,
      keywords: [
        'green dial', 'two tone', 'golden', 'gold', 'black', 'silver', 'blue dial', 
        'emerald', 'jubilee', 'oyster', 'strap', 'stock', 'available hai', 'mil jayegi'
      ]
    }
  },

  // Regex Patterns for Contact Extraction from Public Profiles
  regex: {
    // Matches Pakistani phone numbers: 03071771829, +923071771829, 0307-1771829, 0307 1771829
    pakistanPhone: /(?:(?:\+?92[\s-]?)?0?3[0-4][0-9][\s-]?[0-9]{7})\b/g,
    // Standard email matching
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  },

  // Outreach Copywriting Templates
  templates: {
    // For Gold Leads (WhatsApp / SMS outreach)
    goldWhatsApp: (lead) => {
      const name = lead.name ? lead.name.split(' ')[0] : 'Valued Buyer';
      return `Assalam-o-Alaikum ${name}! ERBE — Legacy of Time se baat kar rahe hain.\n\nHumne dekha aap luxury watches mein interested hain. ERBE par aapko *Rolex Oyster Date (Precision Quartz Tribute Edition)* sirf *Rs. 1,450* mein direct factory import rate par mil rahi hai (Market se 20-30% kam)!\n\n✨ *Key Benefits:*\n📦 *Cash on Delivery (Pakistan-wide)*\n🔍 *Open Parcel Inspection Permitted* (Pehle parcel khol kar tasalli karein, phir payment karein)\n🎁 *Rs. 500 OFF Voucher Code:* ERBE-VIP500\n\nCatalog dekhne ke liye: https://erbewatches.erbewatches.workers.dev/collection\n\nKya hum aapko available 7 colors ki pictures share karein?`;
    },

    // For Silver Leads (Facebook Messenger outreach)
    silverMessenger: (lead) => {
      const name = lead.name ? lead.name.split(' ')[0] : 'Bhai';
      return `Assalam-o-Alaikum ${name}! 👋\n\nHumne dekha aap luxury watch dhoond rahe thay. ERBE — Legacy of Time par Rolex Oyster Date Tribute sirf Rs. 1,450 mein available hai (Direct Import, 20-30% below retail market).\n\n✅ Cash on Delivery (Pakistan-wide)\n✅ Open Parcel Check Permitted (Pehle parcel khol kar check karein, phir payment karein)\n✅ 7 Colors Available (Emerald Green, Two-Tone Gold, Royal Blue, Silver, etc.)\n\nDirect colors check karein: https://erbewatches.erbewatches.workers.dev/collection\nWhatsApp Order: +92 307 1771829`;
    }
  }
};
