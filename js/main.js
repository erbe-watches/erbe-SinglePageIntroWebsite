/* ============================================
   ERBE - Legacy of Time | Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Real-Time Visitor Tracking to Supabase Cloud ----------
  try {
    const today = new Date().toISOString().split('T')[0];
    const sessionKey = 'erbe_cloud_visit_' + today;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      fetch('https://ajqgdcywqdpnrckghyax.supabase.co/rest/v1/leads', {
        method: 'POST',
        headers: {
          'apikey': 'sb_publishable_lHvCsS1U7kPOPlPVLLSpmA_k8ZbPxKv',
          'Authorization': 'Bearer sb_publishable_lHvCsS1U7kPOPlPVLLSpmA_k8ZbPxKv',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          name: 'Site Visitor',
          phone: 'session_' + Math.random().toString(36).substring(2, 9),
          source: 'page_view'
        })
      }).catch(() => {});
    }
  } catch (e) {
    /* Safe fallback */
  }

  // ---------- Header Scroll Effect ----------
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 30);
    });
    header.classList.toggle('scrolled', window.scrollY > 30);
  }

  // ---------- Mobile Menu Toggle ----------
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      nav.classList.toggle('active');
      document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking a nav link
    nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        nav.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('active') && !nav.contains(e.target) && !menuToggle.contains(e.target)) {
        menuToggle.classList.remove('active');
        nav.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ---------- Active Nav Link ----------
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ---------- Supabase Configuration & Lead Sync ----------
  const SUPABASE_CONFIG = {
    url: 'https://ajqgdcywqdpnrckghyax.supabase.co',
    publishableKey: 'sb_publishable_lHvCsS1U7kPOPlPVLLSpmA_k8ZbPxKv'
  };

  async function saveLeadToSupabase(leadData) {
    try {
      const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.publishableKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.publishableKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          name: leadData.name || null,
          phone: leadData.phone || null,
          email: leadData.email || null,
          source: leadData.source || 'remember_modal'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Supabase sync status:', response.status, errorText);
      } else {
        console.log('✅ Lead saved to Supabase successfully!');
      }
    } catch (err) {
      console.warn('Supabase network error (lead preserved locally):', err);
    }
  }

  // ---------- Remember Me Modal Dialog ----------
  const rememberModal = document.querySelector('#rememberModal');
  const openModalBtn = document.querySelector('#openRememberModal');
  const closeModalBtn = document.querySelector('#closeRememberModal');
  const rememberForm = document.querySelector('#rememberForm');
  const rememberSuccess = document.querySelector('#rememberSuccess');
  const closeSuccessBtn = document.querySelector('#closeSuccessBtn');
  const tabPhoneBtn = document.querySelector('#tabPhoneBtn');
  const tabEmailBtn = document.querySelector('#tabEmailBtn');
  const fieldPhoneGroup = document.querySelector('#fieldPhoneGroup');
  const fieldEmailGroup = document.querySelector('#fieldEmailGroup');
  const rememberPhoneInput = document.querySelector('#rememberPhone');
  const rememberEmailInput = document.querySelector('#rememberEmail');
  const errorMsg = document.querySelector('#rememberError');

  let activeContactTab = 'phone';

  function switchContactTab(tab) {
    activeContactTab = tab;
    if (errorMsg) errorMsg.style.display = 'none';

    if (tab === 'phone') {
      tabPhoneBtn?.classList.add('active');
      tabPhoneBtn?.setAttribute('aria-selected', 'true');
      tabEmailBtn?.classList.remove('active');
      tabEmailBtn?.setAttribute('aria-selected', 'false');

      if (fieldPhoneGroup) fieldPhoneGroup.style.display = 'block';
      if (fieldEmailGroup) fieldEmailGroup.style.display = 'none';
      rememberPhoneInput?.focus();
    } else {
      tabEmailBtn?.classList.add('active');
      tabEmailBtn?.setAttribute('aria-selected', 'true');
      tabPhoneBtn?.classList.remove('active');
      tabPhoneBtn?.setAttribute('aria-selected', 'false');

      if (fieldEmailGroup) fieldEmailGroup.style.display = 'block';
      if (fieldPhoneGroup) fieldPhoneGroup.style.display = 'none';
      rememberEmailInput?.focus();
    }
  }

  if (tabPhoneBtn) tabPhoneBtn.addEventListener('click', () => switchContactTab('phone'));
  if (tabEmailBtn) tabEmailBtn.addEventListener('click', () => switchContactTab('email'));

  // Disallow non-numeric characters and enforce max 11 digits in real-time
  if (rememberPhoneInput) {
    rememberPhoneInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
      if (errorMsg) errorMsg.style.display = 'none';
    });
  }

  if (rememberEmailInput) {
    rememberEmailInput.addEventListener('input', () => {
      if (errorMsg) errorMsg.style.display = 'none';
    });
  }

  function preventModalScroll(e) {
    if (!e.target.closest('.modal-card')) {
      e.preventDefault();
    }
  }

  function openRememberDialog() {
    if (rememberModal) {
      rememberModal.classList.add('active');
      rememberModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      // Completely block wheel & touch scrolling on background
      window.addEventListener('wheel', preventModalScroll, { passive: false });
      window.addEventListener('touchmove', preventModalScroll, { passive: false });
    }
  }

  function closeRememberDialog() {
    if (rememberModal) {
      rememberModal.classList.remove('active');
      rememberModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      window.removeEventListener('wheel', preventModalScroll);
      window.removeEventListener('touchmove', preventModalScroll);
      sessionStorage.setItem('erbe_remember_dismissed', 'true');
    }
  }

  // 1) Open via Red Alert Line (header click)
  if (openModalBtn) {
    openModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openRememberDialog();
    });
  }

  // 2) Close via X button
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeRememberDialog);
  }

  // 3) Close via clicking on dark backdrop
  if (rememberModal) {
    rememberModal.addEventListener('click', (e) => {
      if (e.target === rememberModal) {
        closeRememberDialog();
      }
    });
  }

  // 4) Close via Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && rememberModal && rememberModal.classList.contains('active')) {
      closeRememberDialog();
    }
  });

  // 5) Auto-trigger on home page when user scrolls a little bit
  let scrollTriggered = false;
  window.addEventListener('scroll', () => {
    if (!scrollTriggered && window.scrollY > 120) {
      // Check if user has already dismissed or completed it in this session
      const alreadyDone = sessionStorage.getItem('erbe_remember_dismissed');
      if (!alreadyDone) {
        scrollTriggered = true;
        setTimeout(() => {
          openRememberDialog();
        }, 300);
      }
    }
  });

  // 6) Form submission with Supabase Sync & strict validation
  if (rememberForm) {
    rememberForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.querySelector('#rememberName')?.value.trim() || '';
      let normalizedPhone = null;
      let normalizedEmail = null;

      if (!name) {
        if (errorMsg) {
          errorMsg.textContent = 'Baraye meharbani apna mukammal naam darj karein.';
          errorMsg.style.display = 'block';
        }
        document.querySelector('#rememberName')?.focus();
        return;
      }

      // Tab-specific validation
      if (activeContactTab === 'phone') {
        const rawPhone = rememberPhoneInput?.value.replace(/\D/g, '') || '';

        if (!rawPhone) {
          if (errorMsg) {
            errorMsg.textContent = 'Baraye meharbani apna WhatsApp / Mobile number darj karein.';
            errorMsg.style.display = 'block';
          }
          rememberPhoneInput?.focus();
          return;
        }

        if (rawPhone.length === 11) {
          // 11 digits: Must start with 0
          if (!rawPhone.startsWith('0')) {
            if (errorMsg) {
              errorMsg.textContent = '11-digit number 0 se shuru hona chahiye (e.g. 0307 1771829).';
              errorMsg.style.display = 'block';
            }
            rememberPhoneInput?.focus();
            return;
          }
          if (!rawPhone.startsWith('03')) {
            if (errorMsg) {
              errorMsg.textContent = 'Pakistani mobile number 03 se shuru hona chahiye (e.g. 0307 1771829).';
              errorMsg.style.display = 'block';
            }
            rememberPhoneInput?.focus();
            return;
          }
          // Strip leading 0 and format as +92*********
          normalizedPhone = '+92' + rawPhone.substring(1);
        } else if (rawPhone.length === 10) {
          // 10 digits: Must start with 3
          if (!rawPhone.startsWith('3')) {
            if (errorMsg) {
              errorMsg.textContent = '10-digit number 3 se shuru hona chahiye (e.g. 307 1771829).';
              errorMsg.style.display = 'block';
            }
            rememberPhoneInput?.focus();
            return;
          }
          normalizedPhone = '+92' + rawPhone;
        } else {
          if (errorMsg) {
            errorMsg.textContent = 'Ghalat number! Pakistani number 10 ya 11 digits ka hota hai (e.g. 0307 1771829 ya 307 1771829).';
            errorMsg.style.display = 'block';
          }
          rememberPhoneInput?.focus();
          return;
        }
      } else {
        // Email validation with regex
        const rawEmail = rememberEmailInput?.value.trim() || '';
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!rawEmail) {
          if (errorMsg) {
            errorMsg.textContent = 'Baraye meharbani apna email address darj karein.';
            errorMsg.style.display = 'block';
          }
          rememberEmailInput?.focus();
          return;
        }

        if (!emailRegex.test(rawEmail)) {
          if (errorMsg) {
            errorMsg.textContent = 'Ghalat email format! Sahi email darj karein (e.g. name@gmail.com).';
            errorMsg.style.display = 'block';
          }
          rememberEmailInput?.focus();
          return;
        }

        normalizedEmail = rawEmail.toLowerCase();
      }

      if (errorMsg) {
        errorMsg.style.display = 'none';
      }

      const submitBtn = rememberForm.querySelector('.btn-modal-submit');
      const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      }

      // 1. Save user details locally in browser (offline resilience)
      const customerData = {
        name,
        phone: normalizedPhone,
        email: normalizedEmail,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('erbe_saved_customer', JSON.stringify(customerData));
      sessionStorage.setItem('erbe_remember_dismissed', 'true');

      // 2. Fetch Visitor Journey Dossier
      const dossier = window.ERBETracker ? window.ERBETracker.getDossier() : 'Direct Visit';

      // 3. Push to Supabase Cloud Database with full Journey Dossier
      await saveLeadToSupabase({
        name,
        phone: normalizedPhone,
        email: normalizedEmail,
        source: `remember_modal | ${dossier}`
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }

      // 4. Track Conversion in Meta Pixel & GA4
      try {
        if (typeof fbq === 'function') {
          fbq('track', 'Lead', {
            content_name: 'Remember Me VIP Access',
            currency: 'PKR'
          });
        }
        if (typeof gtag === 'function') {
          gtag('event', 'generate_lead', {
            event_category: 'engagement',
            event_label: 'remember_modal'
          });
        }
      } catch (trackErr) {
        console.warn('Analytics tracking error:', trackErr);
      }

      // 5. Setup 1-Tap WhatsApp Claim Link with Visitor Journey
      const claimOnWhatsAppBtn = document.querySelector('#claimOnWhatsAppBtn');
      if (claimOnWhatsAppBtn) {
        const text = window.ERBETracker ? 
          window.ERBETracker.getWhatsAppText({
            name: name,
            phone: normalizedPhone,
            email: normalizedEmail
          }) : 
          `Assalam o Alaikum ERBE! Maine VIP Remember Me join kiya hai:\nName: ${name}\nPhone: ${normalizedPhone || normalizedEmail}\nMera Rs. 500 Discount Voucher (ERBE-VIP500) confirm karein.`;

        claimOnWhatsAppBtn.href = `https://wa.me/923071771829?text=${encodeURIComponent(text)}`;
      }

      // 6. Hide form and show success state
      rememberForm.style.display = 'none';
      if (rememberSuccess) {
        rememberSuccess.style.display = 'block';
      }
    });
  }

  if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', closeRememberDialog);
  }

  // ---------- Scroll Reveal Animation ----------
  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // ---------- FAQ Accordion ----------
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all
        faqItems.forEach(i => i.classList.remove('active'));

        // Toggle current
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  // ---------- FAQ Category Filter ----------
  const faqCatBtns = document.querySelectorAll('.faq-cat-btn');
  faqCatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      faqCatBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.dataset.category;
      const faqItemsAll = document.querySelectorAll('.faq-item');

      faqItemsAll.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // ---------- Contact Form Handler ----------
  const contactForm = document.querySelector('#contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const name = formData.get('name') || '';
      const phone = formData.get('phone') || '';
      const message = formData.get('message') || '';

      // Also persist lead to Supabase
      saveLeadToSupabase({
        name: name,
        phone: phone,
        email: null,
        source: 'contact_page: ' + (message ? message.substring(0, 80) : '')
      });

      // Track Contact Form Event in Meta Pixel & GA4
      try {
        if (typeof fbq === 'function') {
          fbq('track', 'Contact', {
            content_name: 'Contact Page Form',
            currency: 'PKR'
          });
        }
        if (typeof gtag === 'function') {
          gtag('event', 'contact', {
            event_category: 'conversion',
            event_label: 'contact_form'
          });
        }
      } catch (trackErr) {
        console.warn('Analytics tracking error:', trackErr);
      }

      // Open WhatsApp with pre-filled message
      const whatsappMsg = encodeURIComponent(
        `Hello ERBE Watches!\n\nName: ${name}\nPhone: ${phone}\n\nMessage: ${message}`
      );
      window.open(`https://wa.me/923071771829?text=${whatsappMsg}`, '_blank');

      // Reset form
      contactForm.reset();

      // Show success feedback
      const submitBtn = contactForm.querySelector('.form-submit .btn');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
      submitBtn.style.background = '#2E7D32';
      submitBtn.style.color = '#FFFFFF';
      setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.style.background = '';
        submitBtn.style.color = '';
      }, 3000);
    });
  }

  // ---------- WhatsApp Click Event Tracking (Buttons & Floating Links) ----------
  document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
    link.addEventListener('click', () => {
      try {
        if (typeof fbq === 'function') {
          fbq('track', 'Contact', {
            content_name: 'WhatsApp Click',
            currency: 'PKR'
          });
        }
        if (typeof gtag === 'function') {
          gtag('event', 'contact', {
            event_category: 'conversion',
            event_label: 'whatsapp_chat'
          });
        }
      } catch (trackErr) {
        console.warn('Analytics tracking error:', trackErr);
      }
    });
  });

  // ---------- Smooth scroll for anchor links ----------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const alertHeight = document.querySelector('.alert-bar')?.offsetHeight || 0;
        const targetPos = target.getBoundingClientRect().top + window.scrollY - headerHeight - alertHeight;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      }
    });
  });

  // ---------- Year in footer ----------
  const yearEl = document.querySelector('#currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});
