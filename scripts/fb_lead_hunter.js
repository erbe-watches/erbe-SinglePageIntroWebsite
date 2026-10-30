/**
 * ERBE — Legacy of Time
 * Facebook Lead Hunter & Outreach System
 * Automated Lead Extraction, Intent Qualification, Profile Inspection, and Safe Outreach
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { chromium } = require('playwright-core');
const config = require('./config');
const { classifyComment, extractContacts, determineLeadTier } = require('./classifier');

// Data storage directory
const DATA_DIR = path.resolve(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'fb_leads.json');
const TARGETS_FILE = path.resolve(__dirname, 'targets.txt');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load existing leads database
function loadLocalLeads() {
  if (fs.existsSync(LEADS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
    } catch (e) {
      return [];
    }
  }
  return [];
}

// Save leads to local database
function saveLocalLeads(leads) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
}

// Random delay between min and max ms
function sleepRandom(minMs, maxMs) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sync single lead to Supabase cloud table
async function syncLeadToSupabase(lead) {
  try {
    const payload = {
      name: lead.name || 'Facebook User',
      phone: lead.phone || 'FB Messenger Only',
      email: lead.email || null,
      source: lead.tier === 'gold' 
        ? `fb_gold_hunter | ${lead.intentCategory || 'Price Inquiry'}` 
        : `fb_silver_hunter | ${lead.intentCategory || 'Messenger Lead'}`
    };

    const res = await fetch(`${config.supabase.url}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': config.supabase.anonKey,
        'Authorization': `Bearer ${config.supabase.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      console.log(`  ☁️  [Supabase Sync] Saved to cloud: ${lead.name} (${lead.tier.toUpperCase()})`);
      return true;
    } else {
      const errTxt = await res.text();
      console.warn(`  ⚠️  [Supabase Status ${res.status}]: ${errTxt}`);
      return false;
    }
  } catch (err) {
    console.warn(`  ⚠️  [Supabase Network Error]: ${err.message}`);
    return false;
  }
}

// ============================================================================
// MODE 1: LOGIN & SESSION INITIALIZATION
// ============================================================================
async function runLoginSession() {
  console.log('\n=============================================================');
  console.log('🔑 ERBE FACEBOOK LEAD HUNTER — CHROME SESSION SETUP');
  console.log('=============================================================');
  console.log('Chrome browser window open ho raha hai...');
  console.log('1. Apna Facebook account login karein.');
  console.log('2. Jab Facebook Feed samne aa jaye, wapas yahan aakar Enter dabayein.');
  console.log('3. Session cookies permanently save rahengi (Next time auto-login).\n');

  const context = await chromium.launchPersistentContext(config.browser.userDataDir, {
    executablePath: config.browser.executablePath,
    headless: false,
    viewport: config.browser.viewport,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  await page.goto('https://www.facebook.com');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise((resolve) => {
    rl.question('👉 Facebook login mukammal hone ke baad [ENTER] dabayein: ', () => {
      rl.close();
      resolve();
    });
  });

  console.log('✅ Session cookies successfully saved to .fb_session_profile!');
  await context.close();
  console.log('Browser band kar diya gaya hai. Ab aap "npm run hunter:scan" chala sakte hain.\n');
}

// ============================================================================
// MODE 2: DAILY DISCOVERY ENGINE (3 High Potential Queries for Pakistan)
// ============================================================================
function runDailyDiscovery() {
  console.log('\n=============================================================');
  console.log('🔍 ERBE FACEBOOK DISCOVERY — DAILY 3 TARGET QUERIES (PAKISTAN)');
  console.log('=============================================================');
  console.log('Aapko koi bhi group join karne ki zaroorat nahi hai.');
  console.log('Neeche diye gaye 3 links open karein aur public posts ke URLs targets.txt mein paste karein:\n');

  config.dailyDiscovery.forEach((item, idx) => {
    console.log(`📌 ${idx + 1}. ${item.title}`);
    console.log(`   Description: ${item.description}`);
    console.log(`   Search Terms: ${item.searchKeywords.join(' | ')}`);
    console.log('   Direct Facebook Search Links (Open without joining):');
    if (item.samplePages) item.samplePages.forEach(u => console.log(`     👉 ${u}`));
    if (item.sampleGroupSearches) item.sampleGroupSearches.forEach(u => console.log(`     👉 ${u}`));
    if (item.sampleVideoSearches) item.sampleVideoSearches.forEach(u => console.log(`     👉 ${u}`));
    console.log('');
  });

  console.log('Target post links copy karke scripts/targets.txt mein paste karein.');
  console.log('Phir scan chalane ke liye run karein: npm run hunter:scan\n');
}

// ============================================================================
// MODE 3: COMMENT SCANNING, INTENT SCORING, AND CONTACT OUTREACH
// ============================================================================
async function runScanWorkflow(targetUrlsArg) {
  let targetUrls = [];

  if (targetUrlsArg && targetUrlsArg.length > 0) {
    targetUrls = targetUrlsArg;
  } else if (fs.existsSync(TARGETS_FILE)) {
    const raw = fs.readFileSync(TARGETS_FILE, 'utf8');
    targetUrls = raw
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith('#') && l.startsWith('http'));
  }

  if (targetUrls.length === 0) {
    console.log('\n⚠️  Koi target URL nahi mila!');
    console.log('1. scripts/targets.txt file open karein aur Facebook post URL paste karein.');
    console.log('   Ya command line par pass karein: node scripts/fb_lead_hunter.js --scan --url "https://facebook.com/..."');
    console.log('2. Ya recommendations dekhne ke liye run karein: npm run hunter:discover\n');
    return;
  }

  console.log('\n=============================================================');
  console.log('🚀 ERBE FACEBOOK LEAD HUNTER — SCANNING STARTED');
  console.log('=============================================================');
  console.log(`Total Target Posts to Scan: ${targetUrls.length}`);
  console.log('Launching browser with saved session profile...\n');

  const context = await chromium.launchPersistentContext(config.browser.userDataDir, {
    executablePath: config.browser.executablePath,
    headless: false,
    viewport: config.browser.viewport,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  // Load existing leads to prevent duplicates
  const existingLeads = loadLocalLeads();
  const existingProfileUrls = new Set(existingLeads.map(l => l.profileUrl).filter(Boolean));
  let todayDMsSent = existingLeads.filter(l => {
    if (!l.contactedAt) return false;
    const diff = Date.now() - new Date(l.contactedAt).getTime();
    return diff < 24 * 3600 * 1000 && l.messengerStatus === 'sent';
  }).length;

  console.log(`📊 Existing Leads in Local DB: ${existingLeads.length}`);
  console.log(`📊 Today's DMs Sent So Far: ${todayDMsSent} / ${config.safety.maxDailyDMs} (Daily Safe Cap)\n`);

  for (let i = 0; i < targetUrls.length; i++) {
    const url = targetUrls[i];
    console.log(`\n-------------------------------------------------------------`);
    console.log(`🎯 [Post ${i + 1}/${targetUrls.length}] Navigating to: ${url}`);
    console.log(`-------------------------------------------------------------`);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await sleepRandom(2000, 3500);

      // Check if logged in
      const currentUrl = page.url();
      if (currentUrl.includes('/login') || currentUrl.includes('/checkpoint')) {
        console.error('❌ Facebook login required! Please run: npm run hunter:login');
        await context.close();
        return;
      }

      // Scroll to load comments
      console.log('  📜 Scrolling down to expand comments section...');
      for (let s = 0; s < 4; s++) {
        await page.evaluate(() => window.scrollBy(0, 700));
        await sleepRandom(1500, 2500);
      }

      // Try expanding "View more comments" or "All comments"
      try {
        const moreBtn = await page.$('text="View more comments", text="All comments", text="View previous comments"');
        if (moreBtn) {
          await moreBtn.click();
          await sleepRandom(2000, 3000);
        }
      } catch (e) {}

      // Scrape comment elements
      const comments = await page.evaluate(() => {
        const results = [];
        // Facebook comments usually reside inside [role="article"] or data-ad-preview
        const nodes = document.querySelectorAll('[role="article"], div[dir="auto"]');
        
        nodes.forEach((el) => {
          const text = el.innerText || '';
          if (text.length > 3 && text.length < 500) {
            // Find parent or sibling author link
            let authorLink = null;
            let authorName = '';
            
            const link = el.querySelector('a[href*="/user/"], a[href*="facebook.com/"], a[role="link"]');
            if (link) {
              authorLink = link.href;
              authorName = link.innerText.trim();
            }

            results.push({
              text: text.trim(),
              authorLink,
              authorName
            });
          }
        });
        return results;
      });

      console.log(`  🔎 Found ${comments.length} comment fragments on page. Analyzing intent...`);

      let leadsFoundInPost = 0;

      for (const item of comments) {
        const classification = classifyComment(item.text);

        if (classification.isIntentLead) {
          leadsFoundInPost++;
          console.log(`\n  ⭐ HIGH INTENT COMMENT DETECTED (Score: ${classification.score}/100)`);
          console.log(`     Comment: "${item.text.replace(/\n/g, ' ')}"`);
          console.log(`     Trigger: ${classification.reason}`);

          const authorName = item.authorName || 'Facebook Customer';
          let profileUrl = item.authorLink || null;

          // Clean profile URL (remove ref and tracking query parameters)
          if (profileUrl) {
            profileUrl = profileUrl.split('?')[0].split('&')[0];
          }

          // Check if already processed
          if (profileUrl && existingProfileUrls.has(profileUrl)) {
            console.log(`     ℹ️  Already in database (${authorName}). Skipping duplicate.`);
            continue;
          }

          let contactData = { phones: [], emails: [], primaryPhone: null, primaryEmail: null };

          // Step 1: Also check if phone or email was directly in the comment text itself
          contactData = extractContacts(item.text);

          // Step 2: If no contact in comment, inspect public profile About section
          if (!contactData.primaryPhone && !contactData.primaryEmail && profileUrl) {
            console.log(`     🔎 Checking public profile for contact info: ${profileUrl}...`);
            try {
              const profilePage = await context.newPage();
              const aboutUrl = profileUrl.includes('profile.php') 
                ? `${profileUrl}&sk=about_contact_and_basic_info` 
                : `${profileUrl}/about_contact_and_basic_info`;

              await profilePage.goto(aboutUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
              await sleepRandom(2000, 3000);

              const pageText = await profilePage.evaluate(() => document.body.innerText || '');
              const profileContacts = extractContacts(pageText);

              if (profileContacts.primaryPhone) contactData.primaryPhone = profileContacts.primaryPhone;
              if (profileContacts.primaryEmail) contactData.primaryEmail = profileContacts.primaryEmail;

              await profilePage.close();
            } catch (err) {
              console.log(`     ⚠️  Could not read profile: ${err.message}`);
            }
          }

          // Step 3: Determine Lead Tier
          const tier = determineLeadTier(contactData);
          console.log(`     🏅 Lead Tier Assigned: ${tier.toUpperCase()}`);

          let messengerStatus = 'not_attempted';

          // Step 4: Handle Silver Lead Outreach via Facebook Messenger
          if (tier === 'silver' && profileUrl) {
            if (todayDMsSent < config.safety.maxDailyDMs) {
              console.log(`     💬 Initiating human-safe Facebook Messenger DM to ${authorName}...`);
              try {
                const msgPage = await context.newPage();
                await msgPage.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await sleepRandom(2000, 3500);

                // Look for "Message" button on profile
                const messageBtn = await msgPage.$('div[aria-label="Message"], a[aria-label="Message"], role=button:has-text("Message")');
                if (messageBtn) {
                  await messageBtn.click();
                  await sleepRandom(2500, 4000);

                  const dmText = config.templates.silverMessenger({ name: authorName });

                  // Safe type in chat input box
                  const chatBox = await msgPage.$('[role="textbox"], div[contenteditable="true"]');
                  if (chatBox) {
                    await chatBox.fill(dmText);
                    await sleepRandom(1000, 2000);
                    await chatBox.press('Enter');
                    
                    todayDMsSent++;
                    messengerStatus = 'sent';
                    console.log(`     ✅ Messenger DM sent successfully! (Daily count: ${todayDMsSent}/${config.safety.maxDailyDMs})`);
                    console.log(`     ⏳ Safety delay: Pausing 35 seconds to avoid spam flag...`);
                    await sleepRandom(config.safety.minActionDelayMs, config.safety.maxActionDelayMs);
                  } else {
                    messengerStatus = 'chatbox_not_found';
                    console.log('     ⚠️  Could not find chat input box.');
                  }
                } else {
                  messengerStatus = 'message_button_not_found';
                  console.log('     ⚠️  Profile "Message" button is private or restricted.');
                }
                await msgPage.close();
              } catch (dmErr) {
                console.log(`     ⚠️  Messenger outreach error: ${dmErr.message}`);
                messengerStatus = 'failed: ' + dmErr.message;
              }
            } else {
              messengerStatus = 'daily_limit_reached';
              console.log(`     🛑 Daily DM limit reached (${config.safety.maxDailyDMs}/day). Silver lead saved to Admin Portal queue.`);
            }
          }

          // Step 5: Construct complete Lead record
          const leadRecord = {
            id: 'fb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            name: authorName,
            profileUrl: profileUrl,
            phone: contactData.primaryPhone,
            email: contactData.primaryEmail,
            commentText: item.text,
            intentScore: classification.score,
            intentCategory: classification.topCase,
            matchedKeywords: classification.matchedKeywords,
            groupOrPostName: url.includes('/groups/') ? 'Pakistani Watch Group (Public)' : 'Competitor Watch Post / Reel',
            fetchReason: `High Buying Intent (${classification.topCase}): Commented "${item.text.slice(0, 80)}" exhibiting direct purchase need.`,
            tier: tier,
            messengerStatus: messengerStatus,
            postUrl: url,
            createdAt: new Date().toISOString(),
            contactedAt: messengerStatus === 'sent' ? new Date().toISOString() : null
          };

          // Save to local DB & Supabase
          existingLeads.unshift(leadRecord);
          saveLocalLeads(existingLeads);
          if (profileUrl) existingProfileUrls.add(profileUrl);

          await syncLeadToSupabase(leadRecord);
        }
      }

      console.log(`  ✅ Finished post #${i + 1}. High-intent leads extracted: ${leadsFoundInPost}`);
      await sleepRandom(4000, 7000);

    } catch (err) {
      console.error(`  ❌ Error scanning ${url}: ${err.message}`);
    }
  }

  await context.close();

  console.log('\n=============================================================');
  console.log('🎉 SCAN WORKFLOW COMPLETED!');
  console.log('=============================================================');
  console.log(`Total Leads in Database: ${existingLeads.length}`);
  console.log(`Gold Leads (Phone/Email Ready): ${existingLeads.filter(l => l.tier === 'gold').length}`);
  console.log(`Silver Leads (Messenger Queue): ${existingLeads.filter(l => l.tier === 'silver').length}`);
  console.log('All leads synced to Supabase and visible on Admin Portal: http://localhost:3000/admin.html\n');
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--login') || args.includes('--setup')) {
    await runLoginSession();
  } else if (args.includes('--discover')) {
    runDailyDiscovery();
  } else if (args.includes('--scan')) {
    const urlIndex = args.indexOf('--url');
    let urls = null;
    if (urlIndex !== -1 && args[urlIndex + 1]) {
      urls = [args[urlIndex + 1]];
    }
    await runScanWorkflow(urls);
  } else {
    console.log(`
👑 ERBE — Legacy of Time | Facebook Lead Hunter CLI

Available Commands:
  npm run hunter:login       Open Chrome and login to Facebook once (Saves session)
  npm run hunter:discover    Show today's 3 Pakistani Public Groups & Competitor searches
  npm run hunter:scan        Scan URLs in scripts/targets.txt, qualify leads, and outreach
  npm run hunter:test        Run unit tests on 20 Pakistani comments and phone regex

Options:
  node scripts/fb_lead_hunter.js --scan --url "https://facebook.com/..."
`);
  }
}

main().catch(err => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
