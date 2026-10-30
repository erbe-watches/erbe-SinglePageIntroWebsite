const fs = require('fs');
const path = require('path');

const adminPath = path.resolve(__dirname, '..', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// 1. HTML SECTION TO INSERT BEFORE </main>
const sectionHtml = `
      <!-- SECTION 3: FACEBOOK LEAD HUNTER (PAKISTAN BUYING INTENT LEADS) -->
      <section class="section-card" id="fbLeadHunterSection">
        <div class="section-header">
          <div class="section-title-wrap">
            <i class="fab fa-facebook" style="color: #1877F2; font-size: 1.45rem;"></i>
            <div>
              <h2 class="section-title">Facebook Intent Leads (Competitor & Group Hunter)</h2>
              <p class="section-desc">Real-time Pakistani watch buyers extracted from competitor comments & buy/sell groups</p>
            </div>
          </div>

          <div class="table-actions">
            <div class="filter-pills" id="fbFilterPills">
              <button class="pill-btn active" data-fb-filter="all"><i class="fas fa-layer-group"></i> All (<span id="fbAllCount">0</span>)</button>
              <button class="pill-btn" data-fb-filter="gold"><i class="fas fa-crown" style="color:#FFD700;"></i> Gold (<span id="fbGoldCount">0</span>)</button>
              <button class="pill-btn" data-fb-filter="silver"><i class="fab fa-facebook-messenger" style="color:#90CAF9;"></i> Silver (<span id="fbSilverCount">0</span>)</button>
            </div>
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input type="text" id="searchFbLeadsInput" class="search-input" placeholder="Search by name, phone, or intent..." />
            </div>
            <button class="btn-export" id="exportFbCsvBtn">
              <i class="fas fa-file-csv"></i> Export FB Leads
            </button>
          </div>
        </div>

        <!-- FB KPI Cards -->
        <div class="fb-kpi-grid">
          <div class="fb-kpi-card">
            <div class="fb-kpi-icon all"><i class="fab fa-facebook-f"></i></div>
            <div class="fb-kpi-info">
              <h4>Total FB Leads</h4>
              <div class="fb-kpi-num" id="totalFbLeadsCount">0</div>
            </div>
          </div>
          <div class="fb-kpi-card">
            <div class="fb-kpi-icon gold"><i class="fas fa-crown"></i></div>
            <div class="fb-kpi-info">
              <h4>🏆 Gold Leads (Direct Phone/WhatsApp)</h4>
              <div class="fb-kpi-num" id="totalGoldLeadsCount">0</div>
            </div>
          </div>
          <div class="fb-kpi-card">
            <div class="fb-kpi-icon silver"><i class="fab fa-facebook-messenger"></i></div>
            <div class="fb-kpi-info">
              <h4>🥈 Silver Leads (Messenger Queue)</h4>
              <div class="fb-kpi-num" id="totalSilverLeadsCount">0</div>
            </div>
          </div>
        </div>

        <!-- Daily 3 Pakistani Target Searches (No Join Required) -->
        <div class="discovery-box">
          <div class="discovery-title">
            <i class="fas fa-crosshairs"></i> Today's 3 Recommended Pakistani Target Searches (Open without joining):
          </div>
          <div class="discovery-targets-grid">
            <div class="discovery-item">
              <div>
                <h5>1. Competitor Posts & Ads</h5>
                <p>Public posts & reels from Pakistani watch sellers where users ask price & COD.</p>
              </div>
              <a href="https://www.facebook.com/search/posts/?q=rolex%20copy%20pakistan" target="_blank" class="btn-discovery-link">
                <i class="fas fa-external-link-alt"></i> Search Competitors
              </a>
            </div>
            <div class="discovery-item">
              <div>
                <h5>2. Public Buy/Sell Groups</h5>
                <p>Open group feeds where buyers post watch requirements without joining.</p>
              </div>
              <a href="https://www.facebook.com/search/groups/?q=watches%20buy%20and%20sell%20pakistan" target="_blank" class="btn-discovery-link">
                <i class="fas fa-external-link-alt"></i> Search Groups
              </a>
            </div>
            <div class="discovery-item">
              <div>
                <h5>3. Viral Watch Reels / Videos</h5>
                <p>Video unboxings with active comment threads asking "how to buy".</p>
              </div>
              <a href="https://www.facebook.com/search/videos/?q=rolex%20watch%20pakistan" target="_blank" class="btn-discovery-link">
                <i class="fas fa-external-link-alt"></i> Search Watch Reels
              </a>
            </div>
          </div>
        </div>

        <!-- FB Leads Table -->
        <div class="table-responsive">
          <table class="leads-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Commenter & Profile</th>
                <th>Tier</th>
                <th>Contact Info</th>
                <th>Intent Case & Comment</th>
                <th>Captured At</th>
                <th>Quick Action</th>
              </tr>
            </thead>
            <tbody id="fbLeadsTableBody">
              <tr>
                <td colspan="7" class="empty-state">
                  <i class="fas fa-spinner fa-spin"></i>
                  <p>Loading Facebook Intent Leads...</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
`;

// Insert Section 3 right before </main>
if (!content.includes('id="fbLeadHunterSection"')) {
  content = content.replace('    </main>', sectionHtml + '    </main>');
  console.log('✅ Injected Section 3 HTML before </main>');
}

// 2. JAVASCRIPT STATE AND FUNCTIONS TO INJECT
const jsToInject = `
    // ====================================================
    // FACEBOOK LEAD HUNTER INTEGRATION
    // ====================================================
    let fbLeadsData = [];
    let currentFbFilter = 'all';

    async function loadFacebookLeads(supabaseLeads) {
      const fbTableBody = document.getElementById('fbLeadsTableBody');
      const allCountEl = document.getElementById('fbAllCount');
      const goldCountEl = document.getElementById('fbGoldCount');
      const silverCountEl = document.getElementById('fbSilverCount');
      const totalFbCountEl = document.getElementById('totalFbLeadsCount');
      const totalGoldCountEl = document.getElementById('totalGoldLeadsCount');
      const totalSilverCountEl = document.getElementById('totalSilverLeadsCount');

      let combinedLeads = [];

      // 1. Try loading rich local JSON database
      try {
        const localRes = await fetch('/scripts/data/fb_leads.json');
        if (localRes.ok) {
          const localList = await localRes.json();
          combinedLeads = localList;
        }
      } catch (e) {
        console.log('Local fb_leads.json not accessible, using Supabase leads');
      }

      // 2. Merge with Supabase leads tagged with fb_
      if (supabaseLeads && supabaseLeads.length > 0) {
        const fbFromCloud = supabaseLeads.filter(l => l.source && (l.source.startsWith('fb_') || l.source.includes('fb_hunter')));
        
        fbFromCloud.forEach(cloudLead => {
          const exists = combinedLeads.some(l => l.name === cloudLead.name || (l.phone && l.phone === cloudLead.phone));
          if (!exists) {
            const isGold = (cloudLead.phone && !cloudLead.phone.includes('FB Messenger')) || cloudLead.email;
            combinedLeads.push({
              id: cloudLead.id,
              name: cloudLead.name,
              profileUrl: null,
              phone: cloudLead.phone && !cloudLead.phone.includes('FB Messenger') ? cloudLead.phone : null,
              email: cloudLead.email,
              commentText: 'Comment inquiry captured via hunter',
              intentScore: isGold ? 90 : 80,
              intentCategory: cloudLead.source.includes('|') ? cloudLead.source.split('|')[1].trim() : (isGold ? 'High Purchase Urgency' : 'Price Inquiry'),
              tier: isGold ? 'gold' : 'silver',
              messengerStatus: isGold ? 'not_attempted' : 'sent',
              postUrl: '#',
              createdAt: cloudLead.created_at || new Date().toISOString()
            });
          }
        });
      }

      fbLeadsData = combinedLeads;

      // Update counters
      const goldLeads = fbLeadsData.filter(l => l.tier === 'gold');
      const silverLeads = fbLeadsData.filter(l => l.tier === 'silver');

      if (totalFbCountEl) totalFbCountEl.textContent = fbLeadsData.length;
      if (totalGoldCountEl) totalGoldCountEl.textContent = goldLeads.length;
      if (totalSilverCountEl) totalSilverCountEl.textContent = silverLeads.length;
      if (allCountEl) allCountEl.textContent = fbLeadsData.length;
      if (goldCountEl) goldCountEl.textContent = goldLeads.length;
      if (silverCountEl) silverCountEl.textContent = silverLeads.length;

      applyFbFilterAndRender();
    }

    function applyFbFilterAndRender() {
      const searchInput = document.getElementById('searchFbLeadsInput');
      const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

      let filtered = fbLeadsData;

      if (currentFbFilter === 'gold') {
        filtered = filtered.filter(l => l.tier === 'gold');
      } else if (currentFbFilter === 'silver') {
        filtered = filtered.filter(l => l.tier === 'silver');
      }

      if (query) {
        filtered = filtered.filter(l => {
          return (l.name && l.name.toLowerCase().includes(query)) ||
                 (l.phone && l.phone.toLowerCase().includes(query)) ||
                 (l.email && l.email.toLowerCase().includes(query)) ||
                 (l.intentCategory && l.intentCategory.toLowerCase().includes(query)) ||
                 (l.commentText && l.commentText.toLowerCase().includes(query));
        });
      }

      renderFbLeadsTable(filtered);
    }

    function renderFbLeadsTable(leads) {
      const fbTableBody = document.getElementById('fbLeadsTableBody');
      if (!fbTableBody) return;

      if (!leads || leads.length === 0) {
        fbTableBody.innerHTML = \`
          <tr>
            <td colspan="7" class="empty-state">
              <i class="fab fa-facebook" style="color:#1877F2;"></i>
              <p>No Facebook intent leads match the selected filter. Run "npm run hunter:scan" to scan comments.</p>
            </td>
          </tr>
        \`;
        return;
      }

      fbTableBody.innerHTML = leads.map((lead, idx) => {
        const name = lead.name || 'Facebook User';
        const isGold = lead.tier === 'gold';
        const phone = lead.phone || '-';
        const email = lead.email || '-';
        const dateStr = lead.createdAt ? formatDateTime(lead.createdAt) : 'Recent';
        const comment = lead.commentText || '';
        const intentCat = lead.intentCategory || 'Price Inquiry';
        const profileUrl = lead.profileUrl || '#';

        // Direct WhatsApp Link
        let cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '92' + cleanPhone.substring(1);
        const waText = encodeURIComponent(\`Assalam-o-Alaikum \${name}! ERBE — Legacy of Time se rabta kar rahe hain. Humne dekha aap luxury watches mein interested hain. ERBE par Rolex Oyster Date Tribute sirf Rs. 1,450 mein available hai COD + Open Parcel Check ke sath!\`);
        const waLink = cleanPhone ? \`https://wa.me/\${cleanPhone}?text=\${waText}\` : null;

        // Direct Messenger Link
        const messengerLink = lead.profileUrl ? (lead.profileUrl.includes('profile.php') ? \`\${lead.profileUrl}&sk=messages\` : \`https://m.me/\${lead.profileUrl.split('/').filter(Boolean).pop()}\`) : 'https://www.facebook.com/messages';

        return \`
          <tr>
            <td style="color:var(--text-muted); font-weight:600;">\${idx + 1}</td>
            <td>
              <div class="user-pill">
                <div class="avatar-circle" style="\${isGold ? 'border-color:#FFD700; color:#FFD700;' : 'border-color:#1877F2; color:#1877F2;'}">
                  <i class="fab fa-facebook-f"></i>
                </div>
                <div>
                  <span style="font-weight:600;">\${escapeHtml(name)}</span>
                  \${lead.profileUrl ? \`
                    <br><a href="\${lead.profileUrl}" target="_blank" style="font-size:0.72rem; color:#90CAF9; text-decoration:none;">
                      <i class="fas fa-external-link-alt"></i> View Profile
                    </a>
                  \` : ''}
                </div>
              </div>
            </td>
            <td>
              \${isGold ? \`
                <span class="badge-gold-lead"><i class="fas fa-crown"></i> GOLD</span>
              \` : \`
                <span class="badge-silver-lead"><i class="fab fa-facebook-messenger"></i> SILVER</span>
              \`}
            </td>
            <td>
              \${isGold ? \`
                <span class="phone-tag" style="color:#81C784;">\${escapeHtml(phone)}</span>
                \${email !== '-' ? \`<br><span style="font-size:0.75rem; color:var(--gold-light);">\${escapeHtml(email)}</span>\` : ''}
              \` : \`
                <span style="color:var(--text-muted); font-size:0.8rem;"><i class="fab fa-facebook-messenger"></i> Messenger Only</span>
              \`}
            </td>
            <td>
              <div>
                <span class="intent-tag">\${escapeHtml(intentCat)}</span>
                \${lead.intentScore ? \`<span style="font-size:0.7rem; color:var(--gold-light); margin-left:4px;">(\${lead.intentScore}% Intent)</span>\` : ''}
                \${comment ? \`<span class="comment-snippet" title="\${escapeHtml(comment)}">"\${escapeHtml(comment)}"</span>\` : ''}
              </div>
            </td>
            <td style="color:var(--text-muted); font-size:0.8rem;">
              \${dateStr}
            </td>
            <td>
              \${isGold && waLink ? \`
                <a href="\${waLink}" target="_blank" class="btn-wa-direct" title="Chat on WhatsApp">
                  <i class="fab fa-whatsapp"></i> Chat WhatsApp
                </a>
              \` : \`
                <a href="\${messengerLink}" target="_blank" class="btn-messenger-direct" title="Open Messenger Chat">
                  <i class="fab fa-facebook-messenger"></i> Open DM
                </a>
              \`}
            </td>
          </tr>
        \`;
      }).join('');
    }

    // Export FB Leads to CSV
    function exportFbLeadsToCsv() {
      if (!fbLeadsData || fbLeadsData.length === 0) {
        alert('No Facebook leads available to export.');
        return;
      }

      const headers = ['#', 'Name', 'Tier', 'Phone', 'Email', 'Intent Category', 'Intent Score', 'Comment Text', 'Facebook Profile', 'Date Captured'];
      const rows = fbLeadsData.map((l, idx) => [
        idx + 1,
        '"' + (l.name || '').replace(/"/g, '""') + '"',
        l.tier || 'silver',
        '"' + (l.phone || '').replace(/"/g, '""') + '"',
        '"' + (l.email || '').replace(/"/g, '""') + '"',
        '"' + (l.intentCategory || '').replace(/"/g, '""') + '"',
        l.intentScore || 80,
        '"' + (l.commentText || '').replace(/"/g, '""') + '"',
        '"' + (l.profileUrl || '').replace(/"/g, '""') + '"',
        l.createdAt || ''
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', \`erbe_facebook_leads_\${new Date().toISOString().slice(0, 10)}.csv\`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
`;

// Insert the JS code right before window.closeDossierModal
if (!content.includes('function loadFacebookLeads')) {
  content = content.replace('window.closeDossierModal = function() {', jsToInject + '\n    window.closeDossierModal = function() {');
  console.log('✅ Injected Facebook Leads JavaScript functions');
}

// 3. Connect fetchAllDataFromSupabase to call loadFacebookLeads
if (!content.includes('loadFacebookLeads(leadsData)')) {
  content = content.replace('updateKPIsAndChart();', 'updateKPIsAndChart();\n        loadFacebookLeads(leadsData);');
  console.log('✅ Connected Supabase fetch to loadFacebookLeads()');
}

// 4. Connect Event Listeners for Filter Buttons, Search, and Export
const listenersJs = `
    // Facebook Filter Pills Listener
    const fbFilterPills = document.querySelectorAll('#fbFilterPills .pill-btn');
    fbFilterPills.forEach(btn => {
      btn.addEventListener('click', () => {
        fbFilterPills.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFbFilter = btn.dataset.fbFilter || 'all';
        applyFbFilterAndRender();
      });
    });

    // Facebook Search Input Listener
    const searchFbInput = document.getElementById('searchFbLeadsInput');
    if (searchFbInput) {
      searchFbInput.addEventListener('input', () => {
        applyFbFilterAndRender();
      });
    }

    // Export FB Leads CSV Button
    const exportFbBtn = document.getElementById('exportFbCsvBtn');
    if (exportFbBtn) {
      exportFbBtn.addEventListener('click', exportFbLeadsToCsv);
    }
`;

if (!content.includes('fbFilterPills.forEach')) {
  content = content.replace('// Check existing session', listenersJs + '\n    // Check existing session');
  console.log('✅ Attached FB Leads filter, search, and CSV listeners');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('🎉 Successfully patched admin.html with Facebook Lead Hunter!');
