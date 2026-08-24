/* ============================================================
   ABDULLAH AL RAJEE â€” PORTFOLIO JAVASCRIPT
   Three.js 3D Scene Â· Typewriter Â· Scroll Reveal Â· Nav
   ============================================================ */

/* ================================================================
   THREE.JS 3D HERO SCENE
   - 5 000-particle globe (Fibonacci distribution)
   - Indigo/violet colour palette
   - Mouse drag rotation + momentum
   - Glowing core spheres
   - Orbiting energy rings
   - Click shockwave ripple
   ================================================================ */
(function initThreeJS() {
  const container = document.getElementById('hero-canvas');
  if (!container) return;

  if (typeof THREE === 'undefined') {
    setTimeout(initThreeJS, 100);
    return;
  }

  /* --- SIZES --- */
  let W = container.clientWidth  || window.innerWidth;
  let H = container.clientHeight || window.innerHeight;

  /* --- SCENE --- */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.01, 1000);
  camera.position.set(0, 0, 4.8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  /* â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
     1. PARTICLE GLOBE â€” indigo/violet colour palette
     â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */
  const N = 5000;
  const basePos = new Float32Array(N * 3);
  const pos     = new Float32Array(N * 3);
  const colors  = new Float32Array(N * 3);

  for (let i = 0; i < N; i++) {
    const phi   = Math.acos(1 - 2 * (i + 0.5) / N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r     = 1.85 + (Math.random() - 0.5) * 0.12;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);

    basePos[i*3]=x; basePos[i*3+1]=y; basePos[i*3+2]=z;
    pos[i*3]=x;     pos[i*3+1]=y;     pos[i*3+2]=z;

    /* colour: white â†’ gray â†’ near-white by latitude */
    const lat = phi / Math.PI;
    const r_ = lat < 0.35 ? 1.0  : lat < 0.65 ? 0.55 : 0.85;
    const g_ = lat < 0.35 ? 1.0  : lat < 0.65 ? 0.55 : 0.85;
    const b_ = lat < 0.35 ? 1.0  : lat < 0.65 ? 0.55 : 0.85;
    colors[i*3]=r_; colors[i*3+1]=g_; colors[i*3+2]=b_;
  }

  const globeGeo = new THREE.BufferGeometry();
  globeGeo.setAttribute('position', new THREE.BufferAttribute(pos,    3));
  globeGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  /* Soft glowing particle texture */
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
    size: 0.026,
    vertexColors: true,
    map: circleTex,
    alphaMap: circleTex,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const globe = new THREE.Points(globeGeo, globeMat);
  globeGroup.add(globe);

  /* â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
     2. GLOWING CORE â€” indigo layered spheres
     â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */
  function makeGlowSphere(radius, color, opacity) {
    const geo = new THREE.SphereGeometry(radius, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.FrontSide,
    });
    return new THREE.Mesh(geo, mat);
  }

  const core1 = makeGlowSphere(0.55, 0xffffff, 0.22); // indigo core
  const core2 = makeGlowSphere(0.85, 0x888888, 0.12); // deep indigo mid
  const core3 = makeGlowSphere(1.20, 0x111111, 0.10); // dark outer fog
  const core4 = makeGlowSphere(1.75, 0xffffff, 0.03); // subtle fringe
  globeGroup.add(core1, core2, core3, core4);

  /* â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
     3. ORBITING ENERGY RINGS â€” indigo/violet
     â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */
  function makeRing(radius, count, color, tiltX, tiltZ, ptSize) {
    const p   = new Float32Array(count * 3);
    const c   = new THREE.Color(color);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle  = (i / count) * Math.PI * 2;
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
      transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const ring = new THREE.Points(geo, mat);
    ring.rotation.x = tiltX;
    ring.rotation.z = tiltZ;
    return ring;
  }

  const ring1 = makeRing(2.5,  700, 0xffffff, Math.PI*0.12, Math.PI*0.04, 0.022);
  const ring2 = makeRing(2.85, 500, 0x999999, Math.PI*0.42, Math.PI*0.28, 0.018);
  const ring3 = makeRing(3.2,  350, 0xdddddd, Math.PI*0.68, Math.PI*0.55, 0.015);
  globeGroup.add(ring1, ring2, ring3);

  /* â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
     4. WIREFRAME ICOSAHEDRON CAGE
     â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */
  const icoMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.83, 1),
    new THREE.MeshBasicMaterial({
      color: 0xffffff, wireframe: true,
      transparent: true, opacity: 0.06,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  globeGroup.add(icoMesh);

  /* â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
     5. BACKGROUND STARS â€” lavender tint
     â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */
  const STARS = 2500;
  const sPos  = new Float32Array(STARS * 3);
  const sCol  = new Float32Array(STARS * 3);
  for (let i = 0; i < STARS; i++) {
    sPos[i*3]   = (Math.random()-0.5)*80;
    sPos[i*3+1] = (Math.random()-0.5)*80;
    sPos[i*3+2] = (Math.random()-0.5)*80;
    const t = Math.random();
    // indigo / violet / near-white
    sCol[i*3]   = t>0.6 ? 0.4 : t>0.35 ? 0.7 : 0.95;
    sCol[i*3+1] = t>0.6 ? 0.4 : t>0.35 ? 0.7 : 0.95;
    sCol[i*3+2] = 1.0;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  starGeo.setAttribute('color',    new THREE.BufferAttribute(sCol, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    size: 0.06, vertexColors: true, map: circleTex,
    transparent: true, opacity: 0.45,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(stars);

  /* â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
     6. SHOCKWAVE RINGS (click)
     â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */
  const waves = [];
  function spawnWave() {
    const geo  = new THREE.RingGeometry(0.1, 0.18, 64);
    const mat  = new THREE.MeshBasicMaterial({
      color: 0xffffff, side: THREE.DoubleSide,
      transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    globeGroup.add(mesh);
    waves.push({ mesh, t: 0 });
  }
  container.addEventListener('click', spawnWave);

  /* â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
     7. MOUSE â€” drag rotation + momentum
     â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */
  let mouseNX = 0, mouseNY = 0;
  let velX = 0, velY = 0;
  let isDragging = false, prevMX = 0, prevMY = 0;
  let mouseActive = false, mouseTimer = null;

  const heroSection = document.getElementById('hero');

  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    mouseNX = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    mouseNY = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    mouseActive = true;
    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => { mouseActive = false; }, 300);
  });

  heroSection.addEventListener('mousedown', (e) => {
    isDragging = true; prevMX = e.clientX; prevMY = e.clientY;
    velX = 0; velY = 0;
  });
  window.addEventListener('mouseup',    () => { isDragging = false; });
  window.addEventListener('mouseleave', () => { isDragging = false; });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    velY += (e.clientX - prevMX) * 0.018;
    velX += (e.clientY - prevMY) * 0.018;
    prevMX = e.clientX; prevMY = e.clientY;
  });

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

  /* â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
     8. RESIZE
     â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */
  window.addEventListener('resize', () => {
    W = container.clientWidth  || window.innerWidth;
    H = container.clientHeight || window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });

  /* â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
     9. ANIMATION LOOP
     â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */
  const clock   = new THREE.Clock();
  const DAMPING = 0.90;
  const LERP    = 0.08;

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (isDragging) {
      globeGroup.rotation.x += velX;
      globeGroup.rotation.y += velY;
      velX *= DAMPING;
      velY *= DAMPING;
    } else {
      const targetX =  mouseNY * 0.5;
      const targetY =  mouseNX * 0.8;
      globeGroup.rotation.x += (targetX - globeGroup.rotation.x) * LERP;
      globeGroup.rotation.y += (targetY - globeGroup.rotation.y) * LERP;
      velX *= DAMPING;
      velY *= DAMPING;
      if (!mouseActive) globeGroup.rotation.y += 0.0018;
    }

    ring1.rotation.y  =  t * 0.18;
    ring2.rotation.y  = -t * 0.13;
    ring3.rotation.y  =  t * 0.09;

    icoMesh.rotation.y = t * 0.055;
    icoMesh.rotation.x = t * 0.032;

    stars.rotation.y = t * 0.004;

    const pulse  = 0.82 + Math.sin(t * 1.6) * 0.18;
    core1.material.opacity = 0.28 * pulse;
    core1.scale.setScalar(pulse);
    const pulse2 = 0.88 + Math.sin(t * 1.0 + 1.2) * 0.12;
    core2.material.opacity = 0.16 * pulse2;

    globeMat.opacity = 0.80 + Math.sin(t * 0.9) * 0.10;

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
   TYPEWRITER
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
    let ms = del ? 48 : 88;
    if (!del && ch === cur.length)  { ms = 1900; del = true; }
    else if (del && ch === 0)       { del = false; idx = (idx+1)%phrases.length; ms = 380; }
    setTimeout(type, ms);
  }
  setTimeout(type, 1400);
})();

/* ================================================================
   NAV â€” scroll shadow + hamburger + active link
   ================================================================ */
(function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  /* Scroll shadow */
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 50
      ? '0 1px 32px rgba(0,0,0,.5)'
      : 'none';
  }, { passive: true });

  /* Hamburger */
  const btn  = document.getElementById('hamburger');
  const list = document.getElementById('nav-links');
  if (btn && list) {
    btn.addEventListener('click', () => {
      list.classList.toggle('open');
      btn.classList.toggle('open');
    });
    list.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        list.classList.remove('open');
        btn.classList.remove('open');
      });
    });
  }

  /* Active link highlight */
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('#nav-links a');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const a = document.querySelector(`#nav-links a[href="#${e.target.id}"]`);
        if (a) a.classList.add('active');
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => io.observe(s));
})();

/* ================================================================
   SCROLL REVEAL
   ================================================================ */
(function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();

/* ================================================================
   STAT COUNTERS â€” animates .stat-n[data-target]
   ================================================================ */
(function initCounters() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = parseInt(el.dataset.target, 10);
      let t0 = null;
      requestAnimationFrame(function step(ts) {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / 1400, 1);
        el.textContent = Math.floor((1 - Math.pow(1-p, 3)) * target);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target;
      });
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-n[data-target]').forEach(el => io.observe(el));
})();

/* ================================================================
   PROJECT CARD â€” cursor spotlight glow
   ================================================================ */
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width)  * 100;
    const y = ((e.clientY - r.top)  / r.height) * 100;
    card.style.setProperty('--mx', `${x}%`);
    card.style.setProperty('--my', `${y}%`);
    card.style.background = `
      radial-gradient(circle at ${x}% ${y}%, rgba(124,111,247,0.09) 0%, transparent 55%),
      var(--bg-card)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.background = '';
  });
});

/* ================================================================
   CONTACT FORM
   ================================================================ */
(function initContactForm() {
  const form    = document.getElementById('contact-form');
  const btn     = document.getElementById('submit-btn');
  const feedback = document.getElementById('form-feedback');
  if (!form || !btn || !feedback) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = 'Sendingâ€¦';

    try {
      /* Use Formspree or similar â€” replace ACTION with your endpoint */
      const ACTION = 'https://formspree.io/f/placeholder';
      const data   = new FormData(form);
      const res    = await fetch(ACTION, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        feedback.className = 'form-feedback ok';
        feedback.textContent = 'Message sent! I\'ll get back to you soon.';
        feedback.style.display = 'block';
        form.reset();
      } else {
        throw new Error('Network response was not ok.');
      }
    } catch {
      feedback.className = 'form-feedback err';
      feedback.textContent = 'Something went wrong. Please email me directly at rajee0585@gmail.com';
      feedback.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Message';
    }
  });
})();

/* ================================================================
   BACK TO TOP
   ================================================================ */
(function initBackTop() {
  const btn = document.getElementById('back-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ================================================================
   ACTIVE NAV LINK STYLE (injected dynamically)
   ================================================================ */
const _navStyle = document.createElement('style');
_navStyle.textContent = `
  #nav-links a.active { color: var(--t1) !important; }
  #nav-links a.active::after { width: 100% !important; background: var(--a); }
`;
document.head.appendChild(_navStyle);


