/* ============================================================
   ABDULLAH AL RAJEE — PORTFOLIO JAVASCRIPT
   Pure Black & White Minimalist Interaction Engine
   - Light/Dark Theme Switcher (Persisted)
   - Live Dhaka Clock (UTC+6)
   - Typewriter Text Engine
   - Instant Email Clipboard Copy with Toast
   - IntersectionObserver Reveal & Stat Counter
   - Responsive Navigation & Active Scroll Spy
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. THEME SWITCHER (LIGHT / DARK) ─────────────────── */
  const themeToggleBtn = document.getElementById('theme-toggle');
  const sunIcon = document.getElementById('theme-icon-sun');
  const moonIcon = document.getElementById('theme-icon-moon');
  const htmlRoot = document.documentElement;

  // Retrieve stored theme or default to 'light'
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = htmlRoot.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
    });
  }

  function applyTheme(theme) {
    htmlRoot.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    if (sunIcon && moonIcon) {
      if (theme === 'dark') {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
      } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
      }
    }

    // Update meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff');
    }
  }

  /* ── 2. LIVE DHAKA CLOCK (UTC+6) ──────────────────────── */
  const clockEl = document.getElementById('live-clock');
  function updateDhakaClock() {
    if (!clockEl) return;
    const now = new Date();
    // Format to Asia/Dhaka time
    const options = {
      timeZone: 'Asia/Dhaka',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    clockEl.textContent = new Intl.DateTimeFormat('en-US', options).format(now);
  }
  updateDhakaClock();
  setInterval(updateDhakaClock, 1000);

  /* ── 3. TYPEWRITER EFFECT ─────────────────────────────── */
  const typewriterEl = document.getElementById('typewriter');
  if (typewriterEl) {
    const roles = [
      'full-stack platforms.',
      'decentralized blockchain protocols.',
      'high-throughput database systems.',
      'algorithmic problem solutions.',
      'intelligent machine learning tools.'
    ];

    let roleIdx = 0;
    let charIdx = 0;
    let isDeleting = false;

    function handleType() {
      const currentRole = roles[roleIdx];
      
      if (isDeleting) {
        typewriterEl.textContent = currentRole.substring(0, charIdx - 1);
        charIdx--;
      } else {
        typewriterEl.textContent = currentRole.substring(0, charIdx + 1);
        charIdx++;
      }

      let speed = isDeleting ? 40 : 80;

      if (!isDeleting && charIdx === currentRole.length) {
        speed = 2000; // Pause at end of word
        isDeleting = true;
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        roleIdx = (roleIdx + 1) % roles.length;
        speed = 400; // Pause before typing next word
      }

      setTimeout(handleType, speed);
    }

    setTimeout(handleType, 800);
  }

  /* ── 4. TOAST NOTIFICATION & EMAIL COPY ───────────────── */
  const toastEl = document.getElementById('toast');
  let toastTimer = null;

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2800);
  }

  // Bind copy email buttons
  document.querySelectorAll('[data-email]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = btn.getAttribute('data-email') || 'rajee0585@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        showToast(`Copied ${email} to clipboard ✓`);
      }).catch(() => {
        showToast(`Email: ${email}`);
      });
    });
  });

  /* ── 5. INTERSECTION OBSERVER (REVEAL ANIMATIONS) ─────── */
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('visible'));
  }

  /* ── 6. ANIMATED STAT COUNTERS ────────────────────────── */
  const statNumbers = document.querySelectorAll('.stat-val[data-target]');
  if ('IntersectionObserver' in window) {
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-target'), 10);
          let startTime = null;
          const duration = 1200;

          function animateCounter(currentTime) {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(easeOutProgress * target);

            el.textContent = currentVal + (target >= 5 ? '+' : '');

            if (progress < 1) {
              requestAnimationFrame(animateCounter);
            } else {
              el.textContent = target + '+';
            }
          }

          requestAnimationFrame(animateCounter);
          statObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => statObserver.observe(el));
  }

  /* ── 7. ACTIVE NAVIGATION & SCROLL SPY ────────────────── */
  const nav = document.getElementById('nav');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('#nav-links a');

  window.addEventListener('scroll', () => {
    // Dynamic scroll shadow/border state
    if (nav) {
      if (window.scrollY > 20) {
        nav.style.boxShadow = '0 1px 15px rgba(0, 0, 0, 0.05)';
      } else {
        nav.style.boxShadow = 'none';
      }
    }

    // Scroll spy
    let currentSectionId = '';
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height) {
        currentSectionId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });

  /* ── 8. MOBILE HAMBURGER MENU ─────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const navLinksContainer = document.getElementById('nav-links');

  if (hamburger && navLinksContainer) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinksContainer.classList.toggle('open');
    });

    navLinksContainer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinksContainer.classList.remove('open');
      });
    });
  }

  /* ── 9. BACK TO TOP BUTTON ────────────────────────────── */
  const backTopBtn = document.getElementById('back-top');
  if (backTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backTopBtn.classList.add('show');
      } else {
        backTopBtn.classList.remove('show');
      }
    }, { passive: true });

    backTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── 10. CONTACT FORM CLIENT-SIDE HANDLER ─────────────── */
  const contactForm = document.getElementById('contact-form');
  const formFeedback = document.getElementById('form-feedback');
  const submitBtn = document.getElementById('form-submit-btn');

  if (contactForm && formFeedback && submitBtn) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('form-name').value.trim();
      const email = document.getElementById('form-email').value.trim();
      const message = document.getElementById('form-message').value.trim();

      if (!name || !email || !message) {
        formFeedback.className = 'form-feedback error';
        formFeedback.textContent = 'Please fill out all fields before submitting.';
        return;
      }

      // Simulate clean submission & open mailto fallback
      submitBtn.disabled = true;
      submitBtn.textContent = 'Opening Mail Client...';

      const mailtoUrl = `mailto:rajee0585@gmail.com?subject=${encodeURIComponent('Portfolio Contact from ' + name)}&body=${encodeURIComponent(message + '\n\n---\nFrom: ' + name + ' (' + email + ')')}`;

      setTimeout(() => {
        window.location.href = mailtoUrl;
        formFeedback.className = 'form-feedback success';
        formFeedback.textContent = 'Your default email client has been opened. Thank you for reaching out!';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
        contactForm.reset();
      }, 600);
    });
  }

  /* ── 11. CURRENT YEAR AUTOMATION ──────────────────────── */
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

});
