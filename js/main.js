/* ===================================
   Pravinjana Consultants - Main JavaScript
   =================================== */

document.addEventListener('DOMContentLoaded', function () {

  // ===================================
  // Navigation - Scroll Effect
  // ===================================
  const navbar = document.getElementById('navbar');

  function handleNavScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });

  // ===================================
  // Mobile Menu Toggle
  // ===================================
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', function () {
      this.classList.toggle('active');
      navMenu.classList.toggle('active');
      document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking nav links
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ===================================
  // Smooth Scrolling for Anchor Links
  // ===================================
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        const navHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ===================================
  // Contact Form Handling (HubSpot-Ready)
  // ===================================
  const heroForm = document.getElementById('heroContactForm');
  const submitBtn = document.getElementById('formSubmitBtn');

  // ===================================
  // Form Auto-fill from URL Parameters
  // ===================================
  const autofillParams = new URLSearchParams(window.location.search);
  
  const autofillMap = {
    'userName': autofillParams.get('name') || autofillParams.get('userName'),
    'userEmail': autofillParams.get('email'),
    'userMobile': autofillParams.get('mobile') || autofillParams.get('phone'),
    'companyName': autofillParams.get('company') || autofillParams.get('companyName')
  };

  for (const [id, value] of Object.entries(autofillMap)) {
    if (value) {
      const el = document.getElementById(id);
      if (el) el.value = value;
    }
  }

  const bType = autofillParams.get('businessType') || autofillParams.get('business_type');
  if (bType) {
    const bTypeEl = document.getElementById('businessType');
    if (bTypeEl) {
      const bTypeLower = bType.toLowerCase();
      Array.from(bTypeEl.options).forEach(opt => {
        if (opt.value && opt.value.toLowerCase().includes(bTypeLower)) {
          opt.selected = true;
        }
      });
    }
  }

  // ===================================
  // Marketing Attribution Tracking
  // ===================================
  (function initAttributionTracking() {
    const existing = getCookie('pi_tracking');
    let tracking = {};
    if (existing) {
      try { tracking = JSON.parse(existing); } catch(e) {}
    }
    
    // Only set first-touch values if not already set
    if (!tracking.landing_page) {
      const params = new URLSearchParams(window.location.search);
      tracking.landing_page = window.location.href.split('?')[0];
      tracking.referrer = document.referrer || '';
      tracking.utm_source = params.get('utm_source') || '';
      tracking.utm_medium = params.get('utm_medium') || '';
      tracking.utm_campaign = params.get('utm_campaign') || '';
      tracking.utm_term = params.get('utm_term') || '';
      tracking.utm_content = params.get('utm_content') || '';
      tracking.gclid = params.get('gclid') || '';
      tracking.fbclid = params.get('fbclid') || '';
      tracking.first_visit = new Date().toISOString();
      setCookie('pi_tracking', JSON.stringify(tracking), 30);
    }
  })();

  // Capture location via IP (non-blocking, best-effort)
  (function initLocationTracking() {
    if (getCookie('pi_location')) return;
    fetch('https://ipwho.is/')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          const loc = {
            city: data.city || '',
            region: data.region || '',
            country: data.country || '',
            country_code: data.country_code || '',
            ip: data.ip || ''
          };
          setCookie('pi_location', JSON.stringify(loc), 30);
        }
      })
      .catch(function() {});
  })();

  if (heroForm) {
    heroForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Get form values
      const name = document.getElementById('userName').value.trim();
      const email = document.getElementById('userEmail').value.trim();
      const mobile = document.getElementById('userMobile').value.trim();
      const businessTypeEl = document.getElementById('businessType');
      const businessType = businessTypeEl ? businessTypeEl.value : '';
      const companyNameEl = document.getElementById('companyName');
      const companyName = companyNameEl ? companyNameEl.value.trim() : '';

      // URL parameters for campaign tracking
      const urlParams = new URLSearchParams(window.location.search);
      const campaignValue = urlParams.get('utm_campaign') || urlParams.get('campaign') || '';

      // Read attribution tracking cookies
      let tracking = {};
      try {
        const trackingCookie = getCookie('pi_tracking');
        if (trackingCookie) tracking = JSON.parse(trackingCookie);
      } catch(e) {}

      let locationData = {};
      try {
        const locCookie = getCookie('pi_location');
        if (locCookie) locationData = JSON.parse(locCookie);
      } catch(e) {}

      // Basic validation
      if (!name || !email || !mobile || !companyName) {
        showFormError('Please fill in all fields.');
        return;
      }

      if (!isValidEmail(email)) {
        showFormError('Please enter a valid email address.');
        return;
      }

      if (!isValidMobile(mobile)) {
        showFormError('Please enter a valid 10-digit mobile number.');
        return;
      }

      // Show loading state
      setFormLoading(true);

      // =======================================
      // HubSpot CRM Integration
      // =======================================
      var HUBSPOT_PORTAL_ID = '245174552';
      var HUBSPOT_FORM_GUID = '3bc1107d-b15a-4037-815d-714aeaf6a2dd';

      // Read HubSpot tracking cookie
      var hutk = getCookie('hubspotutk');

      var hubspotContext = {
        pageUri: window.location.href,
        pageName: document.title
      };
      if (hutk) {
        hubspotContext.hutk = hutk;
      }

      var hubspotData = {
        fields: [
          { name: 'firstname', value: name },
          { name: 'email', value: email },
          { name: 'phone', value: '+91' + mobile },
          { name: 'business_type', value: businessType },
          { name: 'company', value: companyName }
        ],
        context: hubspotContext
      };

      if (campaignValue) {
        hubspotData.fields.push({ name: 'campaign', value: campaignValue });
      }

      // =======================================
      // Google Sheets / Agency Webhook
      // Send FULL attribution data to a webhook
      // (HubSpot free plan has 10 custom property limit,
      // so we keep HubSpot lean and send everything to Sheets)
      // =======================================
      var WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyJJELUCwfNWdgtr66K4gx_unux8r7qJwzE4fe_4Q3Sc0eIX9IAt3yC-FwuwzkVleLS/exec';

      if (WEBHOOK_URL) {
        var webhookData = {
          timestamp: new Date().toISOString(),
          name: name,
          email: email,
          phone: '+91' + mobile,
          businessType: businessType,
          company: companyName,
          campaign: campaignValue,
          utm_source: tracking.utm_source || '',
          utm_medium: tracking.utm_medium || '',
          utm_campaign: tracking.utm_campaign || '',
          utm_term: tracking.utm_term || '',
          utm_content: tracking.utm_content || '',
          gclid: tracking.gclid || '',
          fbclid: tracking.fbclid || '',
          landing_page: tracking.landing_page || '',
          referrer: tracking.referrer || '',
          lead_location_city: locationData.city || '',
          lead_location_region: locationData.region || '',
          lead_location_country: locationData.country || '',
          pageUrl: window.location.href
        };

        fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        }).catch(function(err) {
          console.log('Webhook error (non-critical):', err);
        });
      }

      fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + HUBSPOT_PORTAL_ID + '/' + HUBSPOT_FORM_GUID, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hubspotData)
      })
        .then(function (response) {
          if (!response.ok) {
            return response.json().then(function (errData) {
              throw new Error(errData.message || 'Submission failed');
            });
          }
          return response.json();
        })
        .then(function (data) {
          setFormLoading(false);
          showFormSuccess();
        })
        .catch(function (error) {
          console.error('HubSpot submission error:', error);
          setFormLoading(false);
          showFormError('Something went wrong. Please try again.');
        });
    });
  }

  // Form Utility Functions
  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function setCookie(name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
  }

  function isValidEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function isValidMobile(mobile) {
    var re = /^[6-9]\d{9}$/;
    return re.test(mobile);
  }

  function setFormLoading(isLoading) {
    if (!submitBtn) return;
    var btnText = submitBtn.querySelector('.btn-text');
    var btnLoader = submitBtn.querySelector('.btn-loader');

    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.85';
      if (btnText) btnText.textContent = 'Submitting...';
      if (btnLoader) btnLoader.style.display = 'inline-flex';
    } else {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      if (btnText) btnText.textContent = 'Get a Callback';
      if (btnLoader) btnLoader.style.display = 'none';
    }
  }

  function showFormSuccess() {
    var formCard = document.getElementById('hero-form-card');
    if (!formCard) return;

    formCard.innerHTML = '\
      <div class="form-glow"></div>\
      <div class="form-success">\
        <div class="success-icon">\
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">\
            <polyline points="20 6 9 17 4 12"></polyline>\
          </svg>\
        </div>\
        <h3>Thank You!</h3>\
        <p>We\'ve received your request. Our CA expert will call you within 30 minutes during business hours.</p>\
      </div>\
    ';
  }

  function showFormError(message) {
    // Remove existing error
    var existingError = heroForm.querySelector('.form-error-message');
    if (existingError) existingError.remove();

    var errorDiv = document.createElement('div');
    errorDiv.className = 'form-error-message';
    errorDiv.style.cssText = 'color: #f87171; font-size: 0.8125rem; text-align: center; padding: 0.5rem; margin-top: -0.5rem; animation: fadeInUp 0.3s ease-out;';
    errorDiv.textContent = message;

    submitBtn.parentNode.insertBefore(errorDiv, submitBtn);

    // Auto-remove after 4 seconds
    setTimeout(function () {
      if (errorDiv && errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 4000);
  }

  // ===================================
  // Input Animations - Focus Effects
  // ===================================
  var formInputs = document.querySelectorAll('.form-input');
  formInputs.forEach(function (input) {
    input.addEventListener('focus', function () {
      this.closest('.form-group').classList.add('focused');
    });

    input.addEventListener('blur', function () {
      this.closest('.form-group').classList.remove('focused');
    });
  });

  // ===================================
  // Mobile number - Allow only digits
  // ===================================
  var mobileInput = document.getElementById('userMobile');
  if (mobileInput) {
    mobileInput.addEventListener('input', function () {
      this.value = this.value.replace(/[^0-9]/g, '');
    });
  }

  // ===================================
  // Scroll Reveal Animation - Comparison Rows
  // ===================================
  var animateRows = document.querySelectorAll('.comparison-row[data-animate]');

  if (animateRows.length > 0 && 'IntersectionObserver' in window) {
    var rowObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // Stagger the animation for each row
          var row = entry.target;
          var allRows = Array.from(animateRows);
          var index = allRows.indexOf(row);
          var delay = index * 120; // 120ms stagger between rows

          setTimeout(function () {
            row.classList.add('is-visible');
          }, delay);

          rowObserver.unobserve(row);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    animateRows.forEach(function (row) {
      rowObserver.observe(row);
    });
  } else {
    // Fallback: show all rows immediately if IntersectionObserver not supported
    animateRows.forEach(function (row) {
      row.classList.add('is-visible');
    });
  }
  // ===================================
  // Scroll Reveal Animation - Suite Cards
  // ===================================
  var suiteCards = document.querySelectorAll('.suite-card[data-animate]');

  if (suiteCards.length > 0 && 'IntersectionObserver' in window) {
    var cardObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var card = entry.target;
          var allCards = Array.from(suiteCards);
          var index = allCards.indexOf(card);
          var delay = index * 100;

          setTimeout(function () {
            card.classList.add('is-visible');
          }, delay);

          cardObserver.unobserve(card);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    suiteCards.forEach(function (card) {
      cardObserver.observe(card);
    });
  } else {
    suiteCards.forEach(function (card) {
      card.classList.add('is-visible');
    });
  }
  // ===================================
  // Scroll Reveal Animation - Process Steps
  // ===================================
  var processSteps = document.querySelectorAll('.process-step[data-step]');

  if (processSteps.length > 0 && 'IntersectionObserver' in window) {
    var stepObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var step = entry.target;
          var allSteps = Array.from(processSteps);
          var index = allSteps.indexOf(step);
          var delay = index * 150;

          setTimeout(function () {
            step.classList.add('is-visible');
          }, delay);

          stepObserver.unobserve(step);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    processSteps.forEach(function (step) {
      stepObserver.observe(step);
    });
  } else {
    processSteps.forEach(function (step) {
      step.classList.add('is-visible');
    });
  }

  // ===================================
  // Scroll Reveal Animation - Checklist Items
  // ===================================
  var checkItems = document.querySelectorAll('.checklist-item[data-check]');

  if (checkItems.length > 0 && 'IntersectionObserver' in window) {
    var checkObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var item = entry.target;
          var allItems = Array.from(checkItems);
          var index = allItems.indexOf(item);
          var delay = index * 60;

          setTimeout(function () {
            item.classList.add('is-visible');
          }, delay);

          checkObserver.unobserve(item);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -30px 0px'
    });

    checkItems.forEach(function (item) {
      checkObserver.observe(item);
    });
  } else {
    checkItems.forEach(function (item) {
      item.classList.add('is-visible');
    });
  }
  // ===================================
  // Scroll Reveal Animation - Testimonial Cards
  // ===================================
  var testimonialCards = document.querySelectorAll('.testimonial-card[data-testimonial]');

  if (testimonialCards.length > 0 && 'IntersectionObserver' in window) {
    var testimonialObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var card = entry.target;
          var allCards = Array.from(testimonialCards);
          var index = allCards.indexOf(card);
          var delay = index * 200;

          setTimeout(function () {
            card.classList.add('is-visible');
          }, delay);

          testimonialObserver.unobserve(card);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    testimonialCards.forEach(function (card) {
      testimonialObserver.observe(card);
    });
  } else {
    testimonialCards.forEach(function (card) {
      card.classList.add('is-visible');
    });
  }

});
