/* ============================================================
   script.js — Minimal Portfolio
   Scroll reveal · Nav · Hamburger · Stat counter · Contact
   ============================================================ */

/* ---- HAMBURGER -------------------------------------------- */
const hamburger  = document.getElementById('hamburger');
const navLinks   = document.getElementById('nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
  });

  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    })
  );
}

/* ---- SCROLL REVEAL ---------------------------------------- */
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => revealObserver.observe(el));

/* ---- STAT COUNTER ----------------------------------------- */
const statNums = document.querySelectorAll('.stat-num[data-target]');

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el     = e.target;
    const target = +el.dataset.target;
    const dur    = 1400;
    const step   = 16;
    const inc    = target / (dur / step);
    let cur = 0;
    const timer = setInterval(() => {
      cur += inc;
      if (cur >= target) { cur = target; clearInterval(timer); }
      el.textContent = Math.floor(cur);
    }, step);
    countObserver.unobserve(el);
  });
}, { threshold: 0.5 });

statNums.forEach(el => countObserver.observe(el));

/* ---- CONTACT FORM ----------------------------------------- */
const contactForm = document.getElementById('contact-form');
const contactBtn  = document.getElementById('contact-btn');
const formStatus  = document.getElementById('form-status');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name    = document.getElementById('c-name').value.trim();
    const email   = document.getElementById('c-email').value.trim();
    const message = document.getElementById('c-msg').value.trim();

    if (!name || !email || !message) return;

    /* Open email client with prefilled content */
    const subject = encodeURIComponent(`Portfolio Enquiry from ${name}`);
    const body    = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`
    );
    window.location.href = `mailto:rajee0585@gmail.com?subject=${subject}&body=${body}`;

    formStatus.textContent    = 'Opening your email client…';
    formStatus.className      = 'form-status success';
    formStatus.style.display  = 'block';

    contactBtn.disabled = true;
    setTimeout(() => {
      contactBtn.disabled = false;
      formStatus.style.display = 'none';
    }, 3000);
  });
}

/* ---- SMOOTH SCROLL for anchor links ----------------------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = document.getElementById('navbar')?.offsetHeight || 64;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - offset,
      behavior: 'smooth'
    });
  });
});
