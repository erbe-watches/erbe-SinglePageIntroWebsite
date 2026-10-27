/* ============================================
   ERBE - Legacy of Time | Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

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

  function openRememberDialog() {
    if (rememberModal) {
      rememberModal.classList.add('active');
      rememberModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeRememberDialog() {
    if (rememberModal) {
      rememberModal.classList.remove('active');
      rememberModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
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

  // 6) Form submission with Supabase Sync
  if (rememberForm) {
    rememberForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = rememberForm.querySelector('.btn-modal-submit');
      const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      }

      const name = document.querySelector('#rememberName')?.value.trim() || '';
      const phone = document.querySelector('#rememberPhone')?.value.trim() || '';
      const email = document.querySelector('#rememberEmail')?.value.trim() || '';

      // 1. Save user details locally in browser (offline resilience)
      const customerData = {
        name,
        phone,
        email,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('erbe_saved_customer', JSON.stringify(customerData));
      sessionStorage.setItem('erbe_remember_dismissed', 'true');

      // 2. Push to Supabase Cloud Database
      await saveLeadToSupabase({
        name,
        phone,
        email,
        source: 'remember_modal'
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }

      // 3. Track Conversion in Meta Pixel & GA4
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

      // 4. Hide form and show success state
      rememberForm.style.display = 'none';
      if (rememberSuccess) {
        rememberSuccess.style.display = 'block';
      }

      // 5. Auto-close after 2.5 seconds
      setTimeout(() => {
        closeRememberDialog();
        setTimeout(() => {
          rememberForm.reset();
          rememberForm.style.display = 'block';
          if (rememberSuccess) rememberSuccess.style.display = 'none';
        }, 400);
      }, 2500);
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
