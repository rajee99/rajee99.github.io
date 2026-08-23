/* ============================================================
   ABDULLAH AL RAJEE - PORTFOLIO JAVASCRIPT
   Three.js 3D Scene + Typewriter + Scroll Animations + Nav
   ============================================================ */

/* ================================================================
   THREE.JS 3D HERO SCENE — ENHANCED
   - 6000-particle globe with Fibonacci distribution
   - Direct mouse-driven globe rotation (not camera shift)
   - Momentum / inertia after mouse leaves
   - Glowing inner core spheres (layered bloom)
   - Mouse-proximity particle repulsion
   - Click → shockwave ripple
   - Orbiting energy rings
   - Dynamic color cycling
   ================================================================ */
(function initThreeJS() {
  const container = document.getElementById('hero-canvas');
  if (!container) return;

  /* Poll until THREE is available (it loads async at bottom of body) */
  if (typeof THREE === 'undefined') {
    setTimeout(initThreeJS, 100);
    return;
  }

  /* --- SIZES --- */
  let W = container.clientWidth  || window.innerWidth;
  let H = container.clientHeight || window.innerHeight;

  /* --- SCENE --- */
  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(55, W / H, 0.01, 1000);
  camera.position.set(0, 0, 4.8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  /* --- GROUP: everything rotates together --- */
  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     1. PARTICLE GLOBE — 6 000 points on sphere surface
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const N = 6000;
  const basePos   = new Float32Array(N * 3); // original positions
  const pos       = new Float32Array(N * 3); // live (for repulsion)
  const colors    = new Float32Array(N * 3);

  for (let i = 0; i < N; i++) {
    const phi   = Math.acos(1 - 2 * (i + 0.5) / N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r     = 1.85 + (Math.random() - 0.5) * 0.12;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);

    basePos[i*3]=x; basePos[i*3+1]=y; basePos[i*3+2]=z;
    pos[i*3]=x;     pos[i*3+1]=y;     pos[i*3+2]=z;

    /* color: cyan / purple / white gradient by latitude */
    const lat = phi / Math.PI; // 0–1
    const r_ = lat < 0.35 ? 0.0  : lat < 0.65 ? 0.48 : 0.9;
    const g_ = lat < 0.35 ? 0.83 : lat < 0.65 ? 0.23 : 0.9;
    const b_ = lat < 0.35 ? 1.0  : lat < 0.65 ? 0.93 : 1.0;
    colors[i*3]=r_; colors[i*3+1]=g_; colors[i*3+2]=b_;
  }

  const globeGeo = new THREE.BufferGeometry();
  globeGeo.setAttribute('position', new THREE.BufferAttribute(pos,    3));
  globeGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  /* Circle texture for rounder, glowing particles */
  const circleTex = (function makeCircle() {
    const c  = document.createElement('canvas');
    c.width  = 64; c.height = 64;
    const cx = c.getContext('2d');
    const gd = cx.createRadialGradient(32,32,0, 32,32,32);
    gd.addColorStop(0,   'rgba(255,255,255,1)');
    gd.addColorStop(0.4, 'rgba(255,255,255,0.8)');
    gd.addColorStop(1,   'rgba(255,255,255,0)');
    cx.fillStyle = gd;
    cx.beginPath();
    cx.arc(32,32,32,0,Math.PI*2);
    cx.fill();
    return new THREE.CanvasTexture(c);
  })();

  const globeMat = new THREE.PointsMaterial({
    size: 0.028,
    vertexColors: true,
    map: circleTex,
    alphaMap: circleTex,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const globe = new THREE.Points(globeGeo, globeMat);
  globeGroup.add(globe);

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     2. GLOWING CORE — layered emissive spheres
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function makeGlowSphere(radius, color, opacity) {
    const geo = new THREE.SphereGeometry(radius, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.FrontSide,
    });
    return new THREE.Mesh(geo, mat);
  }

  const core1 = makeGlowSphere(0.55, 0x00d4ff, 0.35); // bright cyan core
  const core2 = makeGlowSphere(0.85, 0x3a1070, 0.20); // purple mid halo
  const core3 = makeGlowSphere(1.20, 0x001a2e, 0.15); // deep blue outer fog
  const core4 = makeGlowSphere(1.75, 0x00d4ff, 0.04); // subtle fringe
  globeGroup.add(core1, core2, core3, core4);



  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     3. ORBITING ENERGY RINGS
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function makeRing(radius, count, color, tiltX, tiltZ, ptSize) {
    const p = new Float32Array(count * 3);
    const c = new THREE.Color(color);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * 0.07;
      p[i*3]   = (radius + jitter) * Math.cos(angle);
      p[i*3+1] = (Math.random() - 0.5) * 0.04;
      p[i*3+2] = (radius + jitter) * Math.sin(angle);
      col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(p,   3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: ptSize, vertexColors: true, map: circleTex,
      transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const ring = new THREE.Points(geo, mat);
    ring.rotation.x = tiltX;
    ring.rotation.z = tiltZ;
    return ring;
  }

  const ring1 = makeRing(2.5,  700, 0x00d4ff, Math.PI*0.12, Math.PI*0.04, 0.022);
  const ring2 = makeRing(2.85, 500, 0x9d60ff, Math.PI*0.42, Math.PI*0.28, 0.018);
  const ring3 = makeRing(3.2,  350, 0x00ffcc, Math.PI*0.68, Math.PI*0.55, 0.015);
  globeGroup.add(ring1, ring2, ring3);

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     4. WIREFRAME ICOSAHEDRON CAGE
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const icoMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.83, 1),
    new THREE.MeshBasicMaterial({
      color: 0x00d4ff, wireframe: true,
      transparent: true, opacity: 0.07,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  globeGroup.add(icoMesh);

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     5. BACKGROUND STARS (not in globeGroup)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const STARS = 3000;
  const sPos  = new Float32Array(STARS * 3);
  const sCol  = new Float32Array(STARS * 3);
  for (let i = 0; i < STARS; i++) {
    sPos[i*3]   = (Math.random()-0.5)*80;
    sPos[i*3+1] = (Math.random()-0.5)*80;
    sPos[i*3+2] = (Math.random()-0.5)*80;
    const t = Math.random();
    sCol[i*3]   = t>0.6?0.0:t>0.35?0.48:0.85;
    sCol[i*3+1] = t>0.6?0.83:t>0.35?0.23:0.85;
    sCol[i*3+2] = 1.0;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  starGeo.setAttribute('color',    new THREE.BufferAttribute(sCol, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    size: 0.07, vertexColors: true, map: circleTex,
    transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(stars);

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     6. SHOCKWAVE RINGS (click effect)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const waves = [];
  function spawnWave() {
    const geo = new THREE.RingGeometry(0.1, 0.18, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff, side: THREE.DoubleSide,
      transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    globeGroup.add(mesh);
    waves.push({ mesh, t: 0 });
  }

  container.addEventListener('click', spawnWave);

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     7. MOUSE — direct rotation + momentum
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  let mouseNX = 0, mouseNY = 0;  // normalised -1…1
  let velX = 0, velY = 0;        // spin momentum (radians/frame)
  let isDragging = false, prevMX = 0, prevMY = 0;
  let mouseActive = false, mouseTimer = null;

  const heroSection = document.getElementById('hero');

  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    mouseNX = ((e.clientX - rect.left) / rect.width  - 0.5) * 2; // -1…1
    mouseNY = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    mouseActive = true;
    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => { mouseActive = false; }, 300);
  });

  heroSection.addEventListener('mousedown', (e) => {
    isDragging = true;
    prevMX = e.clientX; prevMY = e.clientY;
    velX = 0; velY = 0;
  });
  window.addEventListener('mouseup',    () => { isDragging = false; });
  window.addEventListener('mouseleave', () => { isDragging = false; });

  /* Drag: accumulate velocity directly from delta pixels */
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    velY += (e.clientX - prevMX) * 0.018;  // gentler drag
    velX += (e.clientY - prevMY) * 0.018;
    prevMX = e.clientX;
    prevMY = e.clientY;
  });

  /* Touch */
  let lastTX = 0, lastTY = 0;
  heroSection.addEventListener('touchstart', e => {
    lastTX = e.touches[0].clientX;
    lastTY = e.touches[0].clientY;
    velX = 0; velY = 0;
  }, {passive:true});
  heroSection.addEventListener('touchmove', e => {
    velY += (e.touches[0].clientX - lastTX) * 0.05;
    velX += (e.touches[0].clientY - lastTY) * 0.05;
    lastTX = e.touches[0].clientX;
    lastTY = e.touches[0].clientY;
  }, {passive:true});


  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     8. RESIZE
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  window.addEventListener('resize', () => {
    W = container.clientWidth  || window.innerWidth;
    H = container.clientHeight || window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     9. ANIMATION LOOP
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const clock  = new THREE.Clock();
  const DAMPING = 0.90;  // momentum decay
  const LERP    = 0.08;  // smooth, not twitchy

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (isDragging) {
      /* DRAG MODE — apply accumulated velocity directly, no lerp lag */
      globeGroup.rotation.x += velX;
      globeGroup.rotation.y += velY;
      velX *= DAMPING;
      velY *= DAMPING;
    } else {
      /* HOVER MODE — globe tilts gently toward mouse */
      const targetX =  mouseNY * 0.5;  // subtle up/down
      const targetY =  mouseNX * 0.8;  // subtle left/right
      globeGroup.rotation.x += (targetX - globeGroup.rotation.x) * LERP;
      globeGroup.rotation.y += (targetY - globeGroup.rotation.y) * LERP;

      velX *= DAMPING;
      velY *= DAMPING;

      if (!mouseActive) globeGroup.rotation.y += 0.0018;
    }

    /* --- Rings counter-rotate --- */
    ring1.rotation.y  = t * 0.18;
    ring2.rotation.y  = -t * 0.13;
    ring3.rotation.y  = t * 0.09;

    /* --- Icosahedron slow drift --- */
    icoMesh.rotation.y = t * 0.055;
    icoMesh.rotation.x = t * 0.032;

    /* --- Stars gentle drift --- */
    stars.rotation.y = t * 0.004;

    /* --- Pulse core glow --- */
    const pulse = 0.82 + Math.sin(t * 1.6) * 0.18;
    core1.material.opacity = 0.30 * pulse;
    core1.scale.setScalar(pulse);
    const pulse2 = 0.88 + Math.sin(t * 1.0 + 1.2) * 0.12;
    core2.material.opacity = 0.18 * pulse2;

    /* --- Breathing globe opacity --- */
    globeMat.opacity = 0.80 + Math.sin(t * 0.9) * 0.10;

    /* --- Shockwave animation --- */
    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i];
      w.t += 0.035;
      const s = 1 + w.t * 12;
      w.mesh.scale.setScalar(s);
      w.mesh.material.opacity = Math.max(0, 0.8 - w.t * 0.9);
      w.mesh.rotation.z = t;
      if (w.t > 1) {
        globeGroup.remove(w.mesh);
        w.mesh.geometry.dispose();
        w.mesh.material.dispose();
        waves.splice(i, 1);
      }
    }

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
    'full-stack web platforms',
    'blockchain systems',
    'AI-driven applications',
    'database-driven solutions',
    'clean, scalable software',
  ];

  let idx = 0, ch = 0, del = false;

  function type() {
    const cur = phrases[idx];
    el.textContent = del ? cur.slice(0, ch-1) : cur.slice(0, ch+1);
    del ? ch-- : ch++;
    let ms = del ? 50 : 90;
    if (!del && ch === cur.length)  { ms = 1800; del = true; }
    else if (del && ch === 0)       { del = false; idx = (idx+1)%phrases.length; ms = 350; }
    setTimeout(type, ms);
  }
  setTimeout(type, 1400);
})();

/* ================================================================
   NAVBAR — scroll glass + active link + hamburger
   ================================================================ */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-link');
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const a = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
        if (a) a.classList.add('active');
      }
    });
  }, { threshold: 0.4 }).observe(sections[0]);
  sections.forEach(s => new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const a = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
        if (a) a.classList.add('active');
      }
    });
  }, { threshold: 0.4 }).observe(s));

  const btn  = document.getElementById('hamburger');
  const list = document.getElementById('nav-links');
  if (btn && list) {
    btn.addEventListener('click', () => list.classList.toggle('open'));
    list.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => list.classList.remove('open')));
  }
})();

/* ================================================================
   SCROLL REVEAL
   ================================================================ */
(function () {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

/* ================================================================
   STAT COUNTERS
   ================================================================ */
(function () {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = parseInt(el.dataset.target, 10);
      let t0 = null;
      requestAnimationFrame(function step(ts) {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / 1500, 1);
        el.textContent = Math.floor((1 - Math.pow(1-p, 3)) * target);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target;
      });
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-number').forEach(el => obs.observe(el));
})();

/* ================================================================
   PROJECT CARD SPOTLIGHT
   ================================================================ */
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width)  * 100;
    const y = ((e.clientY - r.top)  / r.height) * 100;
    const g = card.querySelector('.project-glow');
    if (g) g.style.background =
      `radial-gradient(circle at ${x}% ${y}%, rgba(0,212,255,0.14) 0%, transparent 60%)`;
  });
});

/* Active nav link style */
const s = document.createElement('style');
s.textContent = `.nav-link.active{color:var(--accent-cyan)!important}.nav-link.active::after{width:100%!important}`;
document.head.appendChild(s);
