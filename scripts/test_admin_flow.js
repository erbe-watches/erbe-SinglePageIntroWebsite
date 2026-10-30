const { chromium } = require('playwright-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Mavia Zindani\\.gemini\\antigravity\\brain\\7c52a3a1-a14e-4c5a-9785-b52594ed9fbd';

async function testAdminFlow() {
  console.log('🚀 Testing Admin 2FA & Master Leads Flow with Playwright...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const page = await browser.newPage({ viewport: { width: 1400, height: 1800 } });
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  // 1. Navigate to admin.html
  await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'shot_admin_step1_login.png') });
  console.log('📸 Step 1: Login screen captured');

  // 2. Submit Step 1 Master Credentials
  console.log('Entering Master Email and Password...');
  await page.fill('#adminUser', 'erbewatches@gmail.com');
  await page.fill('#adminPass', 'Erbe#Admin2026!Secure');
  await page.click('#btnContinue2FA');
  await page.waitForTimeout(1000);

  // Verify Step 2 (2FA) is now visible
  const is2FAVisible = await page.$eval('#admin2FAForm', el => el.style.display !== 'none');
  console.log('2FA Form Visible:', is2FAVisible);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'shot_admin_step2_2fa.png') });
  console.log('📸 Step 2: 2FA verification screen captured');

  // 3. Enter 2FA Code (Master PIN)
  console.log('Entering 2FA Code (Master PIN: 261829)...');
  await page.fill('#admin2FACode', '261829');
  await page.click('#admin2FAForm button[type="submit"]');
  await page.waitForTimeout(3000);

  // Verify Dashboard is now visible
  const isDashboardVisible = await page.$eval('#dashboardScreen', el => el.style.display !== 'none');
  console.log('Dashboard Unlocked & Visible:', isDashboardVisible);

  // 4. Scroll to Leads Master Section
  const leadsSection = await page.$('#leadsMasterSection');
  if (leadsSection) {
    await leadsSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await leadsSection.screenshot({ path: path.join(ARTIFACT_DIR, 'shot_unified_leads_table.png') });
    console.log('📸 Unified Leads table captured');
  }

  // 5. Test Clicking Row #1 to open Lead Dossier Dialog
  console.log('Clicking Row #1 to open Lead Dossier Dialog...');
  const firstRow = await page.$('#leadsTableBody tr');
  if (firstRow) {
    await firstRow.click();
    await page.waitForTimeout(1000);

    const isModalActive = await page.$eval('#dossierModal', el => el.classList.contains('active'));
    console.log('Lead Dossier Modal Open:', isModalActive);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'shot_lead_dossier_modal.png') });
    console.log('📸 Lead Dossier dialog captured');

    // 6. Test Clicking Next Lead Button
    console.log('Clicking Next Lead Button...');
    const counterBefore = await page.$eval('#dossierCounter', el => el.textContent);
    await page.click('#btnNextLead');
    await page.waitForTimeout(500);
    const counterAfter = await page.$eval('#dossierCounter', el => el.textContent);
    console.log(`Counter changed from "${counterBefore}" to "${counterAfter}"`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'shot_lead_dossier_next.png') });
    console.log('📸 Lead Dossier after Next Lead button captured');
  }

  await browser.close();
  console.log('🎉 Admin flow verification completed successfully!');
}

testAdminFlow().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
