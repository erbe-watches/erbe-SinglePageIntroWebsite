/**
 * ERBE — Legacy of Time
 * Automated Edge-Case & Stress Testing Suite
 * Tests all potential user interactions and edge cases across the entire website.
 */

const { chromium } = require('playwright-core');

async function runEdgeCaseTests() {
  console.log('=====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE WEBSITE FLOW & EDGE-CASE TESTS');
  console.log('=====================================================\n');

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const errors = [];
  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
    console.error('❌ Browser Page Error:', err.message);
  });

  let passed = 0;
  let total = 0;

  function check(condition, testName) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ PASS: ${testName}`);
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
    }
  }

  // ---------------------------------------------------------------
  // TEST 1: HOMEPAGE NAVIGATION & VOUCHER/MODAL FLOW
  // ---------------------------------------------------------------
  console.log('--- 1. Testing Homepage & Remember Modal Flow ---');
  await page.goto('http://localhost:3000/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  check(await page.title() !== '', 'Homepage loads with title');

  // Check header links
  const navLinks = await page.$$eval('.nav .nav-link', links => links.map(a => a.href));
  check(navLinks.length >= 5, `Header nav links found: ${navLinks.length} (Home, Contact, FAQ, Privacy, Terms)`);

  // Test opening Remember Me modal
  const openModalBtn = await page.$('#openRememberModal');
  if (openModalBtn) {
    await openModalBtn.click();
    await page.waitForTimeout(600);
    const modalVisible = await page.$eval('#rememberModal', el => el.classList.contains('active') || el.style.display !== 'none');
    check(modalVisible, 'Remember Me modal opens on banner click');

    // Test filling valid details
    await page.fill('#rememberName', 'Edge Case Test Buyer');
    await page.fill('#rememberPhone', '03071771829');
    await page.evaluate(() => {
      document.querySelector('#rememberForm').requestSubmit();
    });

    // Wait for Supabase network response and success state
    await page.waitForSelector('#rememberSuccess:not([style*="display: none"])', { timeout: 10000 });
    const successVisible = await page.$eval('#rememberSuccess', el => el.style.display !== 'none');
    check(successVisible, 'Remember Me submission shows VIP Voucher and WhatsApp confirmation');

    // Test closing modal
    const closeBtn = await page.$('#closeRememberModal');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(500);
      const modalClosed = await page.$eval('#rememberModal', el => !el.classList.contains('active'));
      check(modalClosed, 'Remember Me modal closes cleanly');
    }
  }

  // ---------------------------------------------------------------
  // TEST 2: COLLECTION PAGE & FILTER PILLS
  // ---------------------------------------------------------------
  console.log('\n--- 2. Testing Collection Catalog & Interactive Filters ---');
  await page.goto('http://localhost:3000/collection.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const initialCardsCount = await page.$$eval('.product-card', cards => cards.length);
  check(initialCardsCount === 10, `All 10 collection timepieces loaded (got ${initialCardsCount})`);

  // Click Rolex filter pill
  await page.click('button[data-filter="rolex"]');
  await page.waitForTimeout(500);
  const rolexVisibleCount = await page.$$eval('.product-card:not([style*="display: none"])', cards => cards.length);
  check(rolexVisibleCount === 7, `Rolex Tribute filter shows exactly 7 items (got ${rolexVisibleCount})`);

  // Click Tubular filter pill
  await page.click('button[data-filter="tubular"]');
  await page.waitForTimeout(500);
  const tubularVisibleCount = await page.$$eval('.product-card:not([style*="display: none"])', cards => cards.length);
  check(tubularVisibleCount === 3, `Tubular Dual Sport filter shows exactly 3 items (got ${tubularVisibleCount})`);

  // Reset filter to All
  await page.click('button[data-filter="all"]');
  await page.waitForTimeout(500);
  const allResetCount = await page.$$eval('.product-card:not([style*="display: none"])', cards => cards.length);
  check(allResetCount === 10, `Resetting to All restores all 10 items`);

  // ---------------------------------------------------------------
  // TEST 3: PRODUCT PAGE EDGE CASES (VARIANTS, FALLBACKS, PARAMS)
  // ---------------------------------------------------------------
  console.log('\n--- 3. Testing Product View Page Edge Cases ---');

  // Case A: Missing parameters (product.html without ?id=)
  await page.goto('http://localhost:3000/product.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const prodTitleA = await page.$eval('#productTitle', el => el.innerText).catch(() => '');
  check(prodTitleA.includes('Rolex') || prodTitleA.length > 0, `product.html with no params defaults gracefully (${prodTitleA})`);

  // Case B: Tubular Dual parameter
  await page.goto('http://localhost:3000/product.html?id=tubular-dual', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const prodTitleB = await page.$eval('#productTitle', el => el.innerText).catch(() => '');
  check(prodTitleB.includes('Tubular'), `product.html?id=tubular-dual loads Tubular Dual Sport (${prodTitleB})`);

  // Case C: Invalid parameter fallback (product.html?id=invalid_xyz_999)
  await page.goto('http://localhost:3000/product.html?id=invalid_xyz_999', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const prodTitleC = await page.$eval('#productTitle', el => el.innerText).catch(() => '');
  check(prodTitleC.length > 0, `product.html?id=invalid_xyz_999 falls back cleanly without breaking (${prodTitleC})`);

  // Case D: Variant selector click updates image and pre-filled WhatsApp link
  await page.goto('http://localhost:3000/product.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const variantPills = await page.$$('.variant-pill');
  if (variantPills.length > 1) {
    // Click second variant
    await variantPills[1].click();
    await page.waitForTimeout(400);

    const waOrderBtn = await page.$('#whatsappOrderBtn');
    const waHref = waOrderBtn ? await waOrderBtn.getAttribute('href') : '';
    check(waHref && waHref.includes('wa.me') && waHref.includes('ERBE'), 'WhatsApp order link updates with voucher and variant details');
  }

  // ---------------------------------------------------------------
  // TEST 4: ALL STATIC PAGES 200 STATUS & LINK HEALTH
  // ---------------------------------------------------------------
  console.log('\n--- 4. Testing All Page Routes ---');
  const pages = [
    'contact.html',
    'faq.html',
    'privacy-policy.html',
    'terms-and-conditions.html',
    'admin.html'
  ];

  for (const p of pages) {
    const res = await page.goto(`http://localhost:3000/${p}`, { waitUntil: 'domcontentloaded' });
    check(res.status() === 200, `Route /${p} responds with HTTP 200`);
  }

  await browser.close();

  console.log('\n=====================================================');
  console.log(`🏁 TESTS COMPLETED: ${passed} / ${total} PASSED (${Math.round(passed/total*100)}%)`);
  if (errors.length > 0) {
    console.log(`⚠️  Browser Errors Logged: ${errors.length}`);
  } else {
    console.log('✅ ZERO Javascript or Console Errors across all tests!');
  }
  console.log('=====================================================\n');

  if (passed === total) process.exit(0);
  else process.exit(1);
}

runEdgeCaseTests().catch(e => {
  console.error('Fatal Test Error:', e);
  process.exit(1);
});
