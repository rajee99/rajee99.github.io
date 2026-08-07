/* ============================================================
   BLOG FEED JAVASCRIPT — blog.js
   Loads posts from Firestore and renders the public feed
   ============================================================ */

const postsFeed = document.getElementById('posts-feed');
const noPosts   = document.getElementById('no-posts');

/* ---- HAMBURGER ---- */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => navLinks.classList.remove('open'))
  );
}

/* ---- LOAD POSTS (real-time) ---- */
db.collection('posts')
  .orderBy('createdAt', 'desc')
  .onSnapshot((snapshot) => {
    postsFeed.innerHTML = '';

    if (snapshot.empty) {
      noPosts.style.display = 'block';
      return;
    }

    noPosts.style.display = 'none';

    snapshot.forEach((doc, i) => {
      const data = doc.data();
      const card = buildPostCard(data, i);
      postsFeed.appendChild(card);
    });
  }, (err) => {
    postsFeed.innerHTML = `<p style="color:#fca5a5;text-align:center;padding:3rem;">
      Failed to load posts. Check your Firebase config.<br>
      <small style="opacity:.6">${err.message}</small>
    </p>`;
  });

/* ---- BUILD A POST CARD ---- */
function buildPostCard(data, index) {
  const card = document.createElement('article');
  card.className = 'post-card';
  card.style.animationDelay = `${index * 0.08}s`;

  const time = formatTimeAgo(data.createdAt);
  const initials = 'AR'; // Abdullah Rajee

  card.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">${initials}</div>
      <div class="post-author-info">
        <div class="post-author-name">Abdullah Al Rajee</div>
        <div class="post-timestamp">${time}</div>
      </div>
    </div>

    ${data.title ? `<h2 class="post-title-text">${escHtml(data.title)}</h2>` : ''}
    ${data.body  ? `<p  class="post-body-text">${escHtml(data.body)}</p>`   : ''}
    ${data.image ? `<img class="post-image" src="${data.image}" alt="Post image" loading="lazy" />` : ''}

    <div class="post-footer">
      <span class="post-tag">📌 Blog</span>
    </div>
  `;

  /* Image lightbox on click */
  const img = card.querySelector('.post-image');
  if (img) {
    img.addEventListener('click', () => openLightbox(img.src));
  }

  return card;
}

/* ---- LIGHTBOX ---- */
function openLightbox(src) {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = `<img src="${src}" alt="Full size" />`;
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}

/* ---- UTILS ---- */
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function formatTimeAgo(ts) {
  if (!ts) return 'just now';
  const date  = ts.toDate ? ts.toDate() : new Date(ts);
  const delta = Math.floor((Date.now() - date.getTime()) / 1000);

  if (delta < 60)        return 'just now';
  if (delta < 3600)      return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400)     return `${Math.floor(delta / 3600)}h ago`;
  if (delta < 604800)    return `${Math.floor(delta / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}
