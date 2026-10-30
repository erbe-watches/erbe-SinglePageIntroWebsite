const { chromium } = require('playwright-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Mavia Zindani\\.gemini\\antigravity\\brain\\7c52a3a1-a14e-4c5a-9785-b52594ed9fbd';
const SHOT_PATH = path.join(ARTIFACT_DIR, 'shot_fb_lead_hunter_admin.png');

async function verify() {
  console.log('Launching Chrome to verify Facebook Lead Hunter dashboard in admin.html...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const page = await browser.newPage({ viewport: { width: 1400, height: 1800 } });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle' });

  // Check if login form is visible
  const loginCard = await page.$('.login-card');
  if (loginCard && await loginCard.isVisible()) {
    console.log('Filling admin credentials...');
    await page.fill('#adminUser', 'erbe_admin');
    await page.fill('#adminPass', 'Erbe#Admin2026!Secure');
    await page.click('.btn-login');
    await page.waitForTimeout(2000);
  }

  // Wait for data load
  await page.waitForTimeout(3000);

  // Scroll to Facebook Hunter section
  const fbSection = await page.$('#fbLeadHunterSection');
  if (fbSection) {
    console.log('Scrolling to Facebook Lead Hunter Section...');
    await fbSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  }

  // Take screenshot of the Facebook Hunter section
  if (fbSection) {
    await fbSection.screenshot({ path: SHOT_PATH });
    console.log('📸 Section screenshot saved to:', SHOT_PATH);
  } else {
    await page.screenshot({ path: SHOT_PATH, fullPage: true });
    console.log('📸 Full page screenshot saved to:', SHOT_PATH);
  }

  await browser.close();
  console.log('Verification complete!');
}

verify().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
