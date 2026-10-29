/**
 * ERBE — Legacy of Time
 * Real-Time Visitor Journey & Product Engagement Tracker
 * Tracks pages visited, products inspected, and exact time spent per item.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'erbe_visitor_journey';
  const SESSION_START_KEY = 'erbe_session_start';
  const OWNER_PHONE = '923071771829'; // 0307 1771829

  // Initialize session start time
  if (!sessionStorage.getItem(SESSION_START_KEY)) {
    sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
  }

  // Get or initialize journey history
  function getJourney() {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveJourney(journey) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(journey));
    } catch (e) {}
  }

  // Current page state
  let currentPageName = 'Home';
  let currentProduct = null;
  let currentVariant = null;
  let pageEnterTime = Date.now();
  let timerInterval = null;

  function identifyPage() {
    const path = window.location.pathname.toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const prodId = urlParams.get('id');

    if (path.includes('product.html')) {
      if (prodId === 'tubular-dual') {
        currentPageName = 'Product: Tubular Dual Sport';
        currentProduct = 'Tubular Dual Display Sport (Original)';
      } else {
        currentPageName = 'Product: Rolex Date Edition';
        currentProduct = 'Rolex Oyster Date (Second Copy)';
      }
    } else if (path.includes('contact.html')) {
      currentPageName = 'Contact Us Page';
    } else if (path.includes('faq.html')) {
      currentPageName = 'FAQ Page';
    } else if (path.includes('privacy-policy.html')) {
      currentPageName = 'Privacy Policy';
    } else if (path.includes('terms-and-conditions.html')) {
      currentPageName = 'Terms & Conditions';
    } else if (path.includes('admin.html')) {
      currentPageName = 'Admin Portal';
    } else {
      currentPageName = 'Home Page';
    }
  }

  identifyPage();

  // Record or update entry in journey
  function recordCurrentTime(durationSec) {
    if (durationSec <= 0) return;

    const journey = getJourney();
    let label = currentPageName;
    if (currentVariant) {
      label += ` [${currentVariant}]`;
    }

    // Check if the last recorded entry is for the same page/variant
    const lastEntry = journey[journey.length - 1];
    if (lastEntry && lastEntry.label === label) {
      lastEntry.seconds += durationSec;
      lastEntry.lastActive = Date.now();
    } else {
      journey.push({
        label: label,
        page: currentPageName,
        product: currentProduct,
        variant: currentVariant,
        seconds: durationSec,
        enteredAt: pageEnterTime,
        lastActive: Date.now()
      });
    }

    saveJourney(journey);
  }

  // Update every 5 seconds
  let lastRecordedStamp = Date.now();
  function tick() {
    const now = Date.now();
    const elapsedSec = Math.floor((now - lastRecordedStamp) / 1000);
    if (elapsedSec >= 3) {
      recordCurrentTime(elapsedSec);
      lastRecordedStamp = now;
    }
  }

  timerInterval = setInterval(tick, 3000);

  // Flush on page unload or visibility change
  window.addEventListener('beforeunload', () => {
    const now = Date.now();
    const elapsedSec = Math.floor((now - lastRecordedStamp) / 1000);
    if (elapsedSec > 0) {
      recordCurrentTime(elapsedSec);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      const now = Date.now();
      const elapsedSec = Math.floor((now - lastRecordedStamp) / 1000);
      if (elapsedSec > 0) {
        recordCurrentTime(elapsedSec);
        lastRecordedStamp = now;
      }
    } else {
      lastRecordedStamp = Date.now();
    }
  });

  // Format seconds to human string e.g. "1m 20s" or "45s"
  function formatSec(sec) {
    if (!sec || sec < 1) return '5s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s}s`;
  }

  // Generate detailed textual dossier
  function generateJourneyDossier() {
    // Flush current pending time
    const now = Date.now();
    const elapsedSec = Math.floor((now - lastRecordedStamp) / 1000);
    if (elapsedSec > 0) {
      recordCurrentTime(elapsedSec);
      lastRecordedStamp = now;
    }

    const journey = getJourney();
    if (journey.length === 0) {
      return `Just arrived at ${currentPageName} (< 10s)`;
    }

    let totalSec = 0;
    const parts = journey.map((item, idx) => {
      totalSec += (item.seconds || 0);
      return `${idx + 1}. ${item.label} (${formatSec(item.seconds)})`;
    });

    return `Visited: ${parts.join(' ➔ ')} | Total Browsing: ${formatSec(totalSec)}`;
  }

  // Generate clean WhatsApp pre-filled text for leads/orders
  function generateWhatsAppText(leadData) {
    const journey = getJourney();
    let totalSec = 0;
    let journeyLines = '';

    if (journey.length > 0) {
      journey.forEach((item, idx) => {
        totalSec += (item.seconds || 0);
        journeyLines += `\n   ${idx + 1}) ${item.label}: ${formatSec(item.seconds)}`;
      });
    } else {
      journeyLines = `\n   1) ${currentPageName}: 15s`;
      totalSec = 15;
    }

    let text = `👑 *ERBE — Legacy of Time | VIP Order & Inquiry*\n\n`;
    text += `👤 *Customer Name:* ${leadData.name || 'Valued Visitor'}\n`;
    if (leadData.phone) text += `📞 *WhatsApp:* ${leadData.phone}\n`;
    if (leadData.email) text += `✉️ *Email:* ${leadData.email}\n`;
    if (leadData.product) {
      text += `⌚ *Selected Watch:* ${leadData.product}\n`;
      if (leadData.variant) text += `🎨 *Variant:* ${leadData.variant}\n`;
      if (leadData.price) text += `💰 *Offer Price:* Rs. ${leadData.price.toLocaleString()} (Voucher Applied)\n`;
    }
    text += `🎟️ *Voucher Code:* ERBE-VIP500 (Rs. 500 OFF Applied)\n`;
    text += `📦 *Delivery Method:* Cash on Delivery (Open Parcel Check Permitted)\n\n`;
    text += `📊 *Visitor Browsing Journey (${formatSec(totalSec)} total):*${journeyLines}\n\n`;
    text += `Please confirm my order and welcome discount!`;

    return text;
  }

  // Public Tracker API
  window.ERBETracker = {
    setProductVariant: function (variantName) {
      const now = Date.now();
      const elapsedSec = Math.floor((now - lastRecordedStamp) / 1000);
      if (elapsedSec > 0) {
        recordCurrentTime(elapsedSec);
      }
      currentVariant = variantName;
      lastRecordedStamp = Date.now();
    },
    getDossier: generateJourneyDossier,
    getWhatsAppText: generateWhatsAppText,
    getOwnerPhone: () => OWNER_PHONE,
    getJourneyData: getJourney
  };

})();
