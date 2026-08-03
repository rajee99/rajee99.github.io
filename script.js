/* ============================================================
   ABDULLAH AL RAJEE - PORTFOLIO JAVASCRIPT
   Three.js 3D Scene + Typewriter + Scroll Animations + Nav
   ============================================================ */

/* ================================================================
   THREE.JS 3D HERO SCENE
   - Rotating particle globe (4000 points on sphere surface)
   - Orbiting particle rings
   - Nebula starfield background
   - Mouse parallax camera movement
   - Floating geometric wireframe
   ================================================================ */
(function initThreeJS() {
  const container = document.getElementById('hero-canvas');
  if (!container || typeof THREE === 'undefined') return;

  /* --- SCENE SETUP --- */
  const W = container.clientWidth  || window.innerWidth;
  const H = container.clientHeight || window.innerHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 2000);
  camera.position.set(0, 0, 5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  /* --- COLORS --- */
  const COLOR_CYAN   = new THREE.Color(0x00d4ff);
  const COLOR_PURPLE = new THREE.Color(0x7c3aed);
  const COLOR_WHITE  = new THREE.Color(0xaabbd0);

  /* ---- 1. PARTICLE GLOBE ---- */
  const GLOBE_COUNT = 4000;
  const globePositions = new Float32Array(GLOBE_COUNT * 3);
  const globeColors    = new Float32Array(GLOBE_COUNT * 3);
  const globeSizes     = new Float32Array(GLOBE_COUNT);

  for (let i = 0; i < GLOBE_COUNT; i++) {
    // Fibonacci sphere distribution for even point spread
    const phi   = Math.acos(1 - (2 * (i + 0.5)) / GLOBE_COUNT);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 1.8 + (Math.random() - 0.5) * 0.15; // slight depth variation

    globePositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    globePositions[i * 3 + 1] = r * Math.cos(phi);
    globePositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    // Mix cyan and purple based on position
    const mix = Math.random();
    const c = mix > 0.55 ? COLOR_CYAN : (mix > 0.25 ? COLOR_PURPLE : COLOR_WHITE);
    globeColors[i * 3]     = c.r;
    globeColors[i * 3 + 1] = c.g;
    globeColors[i * 3 + 2] = c.b;

    globeSizes[i] = Math.random() * 2.5 + 0.8;
  }

  const globeGeo = new THREE.BufferGeometry();
  globeGeo.setAttribute('position', new THREE.BufferAttribute(globePositions, 3));
  globeGeo.setAttribute('color',    new THREE.BufferAttribute(globeColors,    3));
  globeGeo.setAttribute('size',     new THREE.BufferAttribute(globeSizes,     1));

  const globeMat = new THREE.PointsMaterial({
    size: 0.022,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const globe = new THREE.Points(globeGeo, globeMat);
  scene.add(globe);

  /* ---- 2. ORBITING RINGS ---- */
  function createRing(radius, count, color, tiltX, tiltZ, sizeVal) {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color(color);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const spread = (Math.random() - 0.5) * 0.06;
      pos[i * 3]     = (radius + spread) * Math.cos(angle);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      pos[i * 3 + 2] = (radius + spread) * Math.sin(angle);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: sizeVal || 0.025,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const ring = new THREE.Points(geo, mat);
    ring.rotation.x = tiltX;
    ring.rotation.z = tiltZ;
    return ring;
  }

  const ring1 = createRing(2.4, 600, 0x00d4ff, Math.PI * 0.15, Math.PI * 0.05, 0.02);
  const ring2 = createRing(2.7, 400, 0x7c3aed, Math.PI * 0.4,  Math.PI * 0.3,  0.018);
  const ring3 = createRing(3.1, 300, 0x00d4ff, Math.PI * 0.72, Math.PI * 0.6,  0.015);
  scene.add(ring1, ring2, ring3);

  /* ---- 3. WIREFRAME ICOSAHEDRON ---- */
  const icoGeo = new THREE.IcosahedronGeometry(1.78, 1);
  const icoMat = new THREE.MeshBasicMaterial({
    color: 0x00d4ff,
    wireframe: true,
    transparent: true,
    opacity: 0.06,
  });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  scene.add(ico);

  /* ---- 4. NEBULA STARFIELD ---- */
  const STAR_COUNT = 2500;
  const starPos = new Float32Array(STAR_COUNT * 3);
  const starCol = new Float32Array(STAR_COUNT * 3);

  for (let i = 0; i < STAR_COUNT; i++) {
    starPos[i * 3]     = (Math.random() - 0.5) * 60;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 60;

    const c = Math.random();
    starCol[i * 3]     = c > 0.7 ? 0.0  : c > 0.4 ? 0.48 : 0.67;
    starCol[i * 3 + 1] = c > 0.7 ? 0.83 : c > 0.4 ? 0.23 : 0.73;
    starCol[i * 3 + 2] = c > 0.7 ? 1.0  : c > 0.4 ? 0.93 : 0.80;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color',    new THREE.BufferAttribute(starCol, 3));

  const starMat = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* ---- 5. MOUSE PARALLAX ---- */
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ---- 6. SCROLL-BASED GLOBE DRIFT ---- */
  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  /* ---- 7. RESIZE HANDLER ---- */
  window.addEventListener('resize', () => {
    const w = container.clientWidth  || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  /* ---- 8. ANIMATION LOOP ---- */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Smooth mouse follow
    targetX += (mouseX - targetX) * 0.04;
    targetY += (mouseY - targetY) * 0.04;

    // Globe self-rotation
    globe.rotation.y = elapsed * 0.08;
    globe.rotation.x = elapsed * 0.03;

    // Rings counter-rotate for dynamic feel
    ring1.rotation.y = elapsed * 0.12;
    ring2.rotation.y = -elapsed * 0.09;
    ring3.rotation.y = elapsed * 0.06;

    // Icosahedron rotates slowly
    ico.rotation.y = elapsed * 0.07;
    ico.rotation.x = elapsed * 0.04;

    // Stars drift gently
    stars.rotation.y = elapsed * 0.005;
    stars.rotation.x = elapsed * 0.003;

    // Mouse parallax on camera
    camera.position.x += (targetX * 0.5 - camera.position.x) * 0.06;
    camera.position.y += (-targetY * 0.5 - camera.position.y) * 0.06;

    // Scroll-based z drift (globe pulls back slightly on scroll)
    const scrollFactor = scrollY * 0.001;
    camera.position.z = 5 + scrollFactor * 1.5;

    // Pulse globe opacity
    globeMat.opacity = 0.75 + Math.sin(elapsed * 0.8) * 0.1;

    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }

  animate();
})();


/* ================================================================
   TYPEWRITER EFFECT
   ================================================================ */
(function initTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;

  const phrases = [
    'Full-Stack Developer',
    'CS & Engineering Student',
    'Blockchain Enthusiast',
    'AI / ML Explorer',
    'Competitive Programmer',
    'Open Source Contributor',
  ];

  let phraseIdx = 0, charIdx = 0, isDeleting = false;

  function type() {
    const current = phrases[phraseIdx];
    el.textContent = isDeleting
      ? current.substring(0, charIdx - 1)
      : current.substring(0, charIdx + 1);

    isDeleting ? charIdx-- : charIdx++;

    let delay = isDeleting ? 50 : 90;

    if (!isDeleting && charIdx === current.length) {
      delay = 1800; isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
      delay = 400;
    }

    setTimeout(type, delay);
  }

  setTimeout(type, 1400);
})();


/* ================================================================
   NAVBAR — scroll style + active link + hamburger
   ================================================================ */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  // Active section highlight
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => sectionObserver.observe(s));

  // Hamburger toggle
  const hamburger = document.getElementById('hamburger');
  const navLinksList = document.getElementById('nav-links');
  if (hamburger && navLinksList) {
    hamburger.addEventListener('click', () => navLinksList.classList.toggle('open'));
    navLinksList.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => navLinksList.classList.remove('open'))
    );
  }
})();


/* ================================================================
   SCROLL REVEAL ANIMATIONS
   ================================================================ */
(function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();


/* ================================================================
   ANIMATED STAT COUNTERS
   ================================================================ */
(function initCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      let start = 0;
      const duration = 1500;
      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
      };
      requestAnimationFrame(step);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-number').forEach(el => observer.observe(el));
})();


/* ================================================================
   PROJECT CARD SPOTLIGHT (mouse glow follows cursor)
   ================================================================ */
(function initProjectGlow() {
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const glow = card.querySelector('.project-glow');
      if (glow) {
        glow.style.background =
          `radial-gradient(circle at ${x}% ${y}%, rgba(0,212,255,0.14) 0%, transparent 60%)`;
      }
    });
  });
})();


/* ================================================================
   INJECT ACTIVE NAV LINK STYLE
   ================================================================ */
const style = document.createElement('style');
style.textContent = `
  .nav-link.active { color: var(--accent-cyan) !important; }
  .nav-link.active::after { width: 100% !important; }
`;
document.head.appendChild(style);
