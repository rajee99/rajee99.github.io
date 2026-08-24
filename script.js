/* ==========================================================================
   ABDULLAH AL RAJEE — DIGITAL IDENTITY JS ENGINE
   Art-Directed Minimalist Interactions
   - Theme Toggle (Light/Dark persisted in localStorage)
   - IntersectionObserver Reveal System
   - Direct Email Clipboard Engine with Toast
   - Responsive Navigation & Active Scroll Spy
   - Mailto Form Transmitter
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. THEME SWITCHER ───────────────────────────────────────────────── */
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const sunIcon = document.getElementById('sun-icon');
  const moonIcon = document.getElementById('moon-icon');
  const htmlRoot = document.documentElement;

  // Retrieve stored theme preference (default: dark for architectural depth)
  const savedTheme = localStorage.getItem('raj_editorial_theme') || 'dark';
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = htmlRoot.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    });
  }

  function applyTheme(theme) {
    htmlRoot.setAttribute('data-theme', theme);
    localStorage.setItem('raj_editorial_theme', theme);

    if (sunIcon && moonIcon) {
      if (theme === 'light') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
      } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
      }
    }

    // Update meta theme-color tag
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0a0b0e' : '#fbfbfb');
    }
  }

  /* ── 2. TOAST & INSTANT CLIPBOARD COPY ──────────────────────────────── */
  const toastEl = document.getElementById('toast-notification');
  let toastTimeout = null;

  function triggerToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('active');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.remove('active');
    }, 2800);
  }

  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const textToCopy = btn.getAttribute('data-copy') || 'rajee0585@gmail.com';
      navigator.clipboard.writeText(textToCopy).then(() => {
        triggerToast(`Copied "${textToCopy}" to clipboard ✓`);
      }).catch(() => {
        triggerToast(`Email: ${textToCopy}`);
      });
    });
  });

  /* ── 3. INTERSECTION OBSERVER REVEAL ─────────────────────────────────── */
  const revealElements = document.querySelectorAll('.reveal-entry');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('in-view'));
  }

  /* ── 4. SCROLL SPY & HEADER SHADOW ───────────────────────────────────── */
  const header = document.getElementById('header');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { passive: true });

  /* ── 5. MOBILE MENU NAVIGATION ───────────────────────────────────────── */
  const menuTrigger = document.getElementById('mobile-menu-trigger');
  const navLinksContainer = document.getElementById('nav-links');

  if (menuTrigger && navLinksContainer) {
    menuTrigger.addEventListener('click', () => {
      menuTrigger.classList.toggle('open');
      navLinksContainer.classList.toggle('open');
    });

    navLinksContainer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuTrigger.classList.remove('open');
        navLinksContainer.classList.remove('open');
      });
    });
  }

  /* ── 6. CONTACT FORM TRANSMISSION ────────────────────────────────────── */
  const contactForm = document.getElementById('editorial-contact-form');
  const contactStatus = document.getElementById('contact-status');
  const submitBtn = document.getElementById('contact-submit-btn');

  if (contactForm && contactStatus && submitBtn) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const msg = document.getElementById('contact-msg').value.trim();

      if (!name || !email || !msg) return;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>OPENING CLIENT...</span>';

      const mailtoUrl = `mailto:rajee0585@gmail.com?subject=${encodeURIComponent('Inquiry from ' + name)}&body=${encodeURIComponent(msg + '\n\n---\nSender: ' + name + ' (' + email + ')')}`;

      setTimeout(() => {
        window.location.href = mailtoUrl;
        contactStatus.className = 'form-status-message success';
        contactStatus.textContent = 'Opening your local mail client. Thank you for connecting.';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>TRANSMIT MESSAGE</span> <span>→</span>';
        contactForm.reset();
      }, 500);
    });
  }

  /* ── 7. CURRENT YEAR AUTOMATION ──────────────────────────────────────── */
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

});
