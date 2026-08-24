/* ==========================================================================
   ABDULLAH AL RAJEE — JOURNAL JAVASCRIPT ENGINE
   - Real-time Firestore Feed Synchronization
   - Curated Featured Post + Asymmetric Notes Stream
   - Client-Side Article Reader Router (?id=POST_ID)
   - Adjacent Article Navigation (Prev/Next)
   - Reading Time Estimation & Markdown Formatter
   - Lightbox Zoom & Share Clipboard
   - Global Theme Switcher Integration
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. THEME SWITCHER ───────────────────────────────────────────────── */
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const sunIcon = document.getElementById('sun-icon');
  const moonIcon = document.getElementById('moon-icon');
  const htmlRoot = document.documentElement;

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

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0a0b0e' : '#fbfbfb');
    }
  }

  /* ── 2. MOBILE HAMBURGER MENU ───────────────────────────────────────── */
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

  /* ── 3. STATE & DOM ELEMENTS ─────────────────────────────────────────── */
  let loadedPosts = []; // In-memory cache of retrieved Firestore posts

  const feedView = document.getElementById('journal-feed-view');
  const readerView = document.getElementById('article-reader-view');
  const feedLoading = document.getElementById('feed-loading');
  const feedEmpty = document.getElementById('feed-empty');
  const feedContent = document.getElementById('feed-content');
  const featuredContainer = document.getElementById('featured-post-container');
  const secondaryNotesSection = document.getElementById('secondary-notes-section');
  const notesStreamContainer = document.getElementById('notes-stream-container');
  const notesCountTag = document.getElementById('notes-count-tag');

  const btnBackToJournal = document.getElementById('btn-back-to-journal');
  const btnSharePost = document.getElementById('btn-share-post');

  /* ── 4. FIRESTORE REAL-TIME SYNCHRONIZATION ───────────────────────────── */
  if (typeof db !== 'undefined') {
    db.collection('posts')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        feedLoading.style.display = 'none';

        if (snapshot.empty) {
          loadedPosts = [];
          feedEmpty.style.display = 'block';
          feedContent.style.display = 'none';
          return;
        }

        feedEmpty.style.display = 'none';
        feedContent.style.display = 'flex';

        loadedPosts = [];
        snapshot.forEach((doc) => {
          loadedPosts.push({
            id: doc.id,
            ...doc.data()
          });
        });

        renderFeed(loadedPosts);
        handleUrlRouting(); // Check if a direct article was requested in URL
      }, (err) => {
        console.error('Firestore Read Error:', err);
        feedLoading.innerHTML = `
          <p style="color:#fca5a5; font-family:var(--font-mono); font-size:0.85rem;">
            Unable to connect to Firestore feed.<br>
            <small style="opacity:0.7;">${err.message}</small>
          </p>`;
      });
  } else {
    feedLoading.innerHTML = `<p style="color:#fca5a5; font-family:var(--font-mono); font-size:0.85rem;">Firebase configuration missing.</p>`;
  }

  /* ── 5. RENDER CURATED JOURNAL FEED ──────────────────────────────────── */
  function renderFeed(posts) {
    if (!posts || posts.length === 0) return;

    featuredContainer.innerHTML = '';
    notesStreamContainer.innerHTML = '';

    // POST 0: FEATURED TOP ARTICLE
    const featured = posts[0];
    const featuredCard = createFeaturedPostElement(featured);
    featuredContainer.appendChild(featuredCard);

    // POSTS 1..N: SECONDARY NOTES STREAM
    if (posts.length > 1) {
      secondaryNotesSection.style.display = 'block';
      notesCountTag.textContent = `${posts.length - 1} ${posts.length - 1 === 1 ? 'NOTE' : 'NOTES'}`;

      for (let i = 1; i < posts.length; i++) {
        const noteCard = createNoteElement(posts[i], i);
        notesStreamContainer.appendChild(noteCard);
      }
    } else {
      secondaryNotesSection.style.display = 'none';
    }
  }

  /* Create Featured Card DOM */
  function createFeaturedPostElement(post) {
    const card = document.createElement('article');
    card.className = 'featured-post-card';

    const formattedDate = formatPostDate(post.createdAt);
    const readTime = estimateReadTime(post.body || '');
    const title = post.title || 'Untitled Note';
    const excerpt = createExcerpt(post.body || '', 240);
    const tag = post.tag || post.category || 'FEATURED NOTE';

    card.innerHTML = `
      <div class="featured-post-narrative">
        <div>
          <div class="post-meta-line">
            <span class="post-tag-badge">${escHtml(tag)}</span>
            <span class="post-meta-dot"></span>
            <span>${formattedDate}</span>
            <span class="post-meta-dot"></span>
            <span>${readTime}</span>
          </div>

          <h2 class="featured-post-title">${escHtml(title)}</h2>
          <p class="featured-post-excerpt">${escHtml(excerpt)}</p>
        </div>

        <a href="?id=${encodeURIComponent(post.id)}" class="read-action-link" data-post-id="${post.id}">
          <span>READ FULL ENTRY</span>
          <span style="font-size:1.1rem;">↗</span>
        </a>
      </div>

      ${post.image ? `
        <div class="featured-post-media">
          <img src="${post.image}" alt="${escHtml(title)}" loading="lazy" />
        </div>
      ` : `
        <div class="featured-post-media" style="display:flex; align-items:center; justify-content:center; padding:3rem; text-align:center;">
          <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted); letter-spacing:0.1em;">NO VISUAL ATTACHMENT</span>
        </div>
      `}
    `;

    // Intercept click to open seamless reader view
    card.querySelectorAll('[data-post-id]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToArticle(post.id);
      });
    });

    return card;
  }

  /* Create Stream Note Element DOM */
  function createNoteElement(post, index) {
    const card = document.createElement('article');
    card.className = 'note-item-card';

    const formattedDate = formatPostDate(post.createdAt);
    const readTime = estimateReadTime(post.body || '');
    const title = post.title || 'Untitled Note';
    const excerpt = createExcerpt(post.body || '', 140);
    const tag = post.tag || post.category || 'TECHNICAL NOTE';
    const indexStr = String(index).padStart(2, '0');

    card.innerHTML = `
      <div>
        ${post.image ? `
          <div class="note-thumbnail">
            <img src="${post.image}" alt="${escHtml(title)}" loading="lazy" />
          </div>
        ` : ''}

        <div class="post-meta-line">
          <span class="post-tag-badge">${indexStr} / ${escHtml(tag)}</span>
          <span class="post-meta-dot"></span>
          <span>${formattedDate}</span>
        </div>

        <h3 class="note-title">${escHtml(title)}</h3>
        <p class="note-excerpt">${escHtml(excerpt)}</p>
      </div>

      <a href="?id=${encodeURIComponent(post.id)}" class="read-action-link" data-post-id="${post.id}">
        <span>READ ENTRY</span>
        <span style="font-size:1.1rem;">↗</span>
      </a>
    `;

    card.querySelectorAll('[data-post-id]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToArticle(post.id);
      });
    });

    return card;
  }

  /* ── 6. ARTICLE READER VIEW RENDERING ────────────────────────────────── */
  function openArticleReader(post) {
    if (!post) return;

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'instant' });

    feedView.style.display = 'none';
    readerView.style.display = 'block';

    const formattedDate = formatPostDate(post.createdAt);
    const readTime = estimateReadTime(post.body || '');
    const title = post.title || 'Untitled Note';
    const tag = post.tag || post.category || 'TECHNICAL NOTE';

    document.getElementById('article-title').textContent = title;
    document.getElementById('article-tag').textContent = tag;
    document.getElementById('article-date').textContent = formattedDate;
    document.getElementById('article-read-time').textContent = readTime;
    document.title = `${title} — Abdullah Al Rajee`;

    // Render Hero Image if present
    const imageBox = document.getElementById('article-hero-image-box');
    const heroImg = document.getElementById('article-hero-img');
    if (post.image) {
      heroImg.src = post.image;
      heroImg.alt = title;
      imageBox.style.display = 'block';
      heroImg.onclick = () => openLightbox(post.image);
    } else {
      imageBox.style.display = 'none';
    }

    // Render Formatted Prose Content
    const contentBody = document.getElementById('article-content-body');
    contentBody.innerHTML = formatProseText(post.body || '');

    // Setup Adjacent Navigation (Previous / Next)
    setupAdjacentPostNav(post.id);
  }

  function closeArticleReader() {
    feedView.style.display = 'block';
    readerView.style.display = 'none';
    document.title = 'Journal & Technical Notes — Abdullah Al Rajee';
    
    // Update URL query without full reload
    const url = new URL(window.location);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url);
  }

  function setupAdjacentPostNav(currentId) {
    const currentIndex = loadedPosts.findIndex(p => p.id === currentId);
    const prevWrapper = document.getElementById('nav-prev-post');
    const nextWrapper = document.getElementById('nav-next-post');
    const prevLink = document.getElementById('prev-post-link');
    const nextLink = document.getElementById('next-post-link');

    if (currentIndex > 0) {
      const prevPost = loadedPosts[currentIndex - 1];
      prevWrapper.style.visibility = 'visible';
      prevLink.textContent = prevPost.title || 'Previous Note';
      prevLink.onclick = (e) => {
        e.preventDefault();
        navigateToArticle(prevPost.id);
      };
    } else {
      prevWrapper.style.visibility = 'hidden';
    }

    if (currentIndex < loadedPosts.length - 1 && currentIndex !== -1) {
      const nextPost = loadedPosts[currentIndex + 1];
      nextWrapper.style.visibility = 'visible';
      nextLink.textContent = nextPost.title || 'Next Note';
      nextLink.onclick = (e) => {
        e.preventDefault();
        navigateToArticle(nextPost.id);
      };
    } else {
      nextWrapper.style.visibility = 'hidden';
    }
  }

  /* ── 7. URL ROUTING & NAVIGATION CONTROLS ────────────────────────────── */
  function navigateToArticle(postId) {
    const post = loadedPosts.find(p => p.id === postId);
    if (!post) return;

    const url = new URL(window.location);
    url.searchParams.set('id', postId);
    window.history.pushState({ postId }, '', url);

    openArticleReader(post);
  }

  function handleUrlRouting() {
    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get('id');

    if (requestedId && loadedPosts.length > 0) {
      const post = loadedPosts.find(p => p.id === requestedId);
      if (post) {
        openArticleReader(post);
        return;
      }
    }

    // Default to feed
    feedView.style.display = 'block';
    readerView.style.display = 'none';
  }

  window.addEventListener('popstate', (e) => {
    handleUrlRouting();
  });

  if (btnBackToJournal) {
    btnBackToJournal.addEventListener('click', closeArticleReader);
  }

  if (btnSharePost) {
    btnSharePost.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        btnSharePost.innerHTML = `<span>Copied URL ✓</span>`;
        setTimeout(() => {
          btnSharePost.innerHTML = `<span>Copy Link</span> <span class="arrow-glyph">↗</span>`;
        }, 2000);
      });
    });
  }

  /* ── 8. LIGHTBOX MODAL ───────────────────────────────────────────────── */
  function openLightbox(src) {
    const modal = document.createElement('div');
    modal.className = 'lightbox-modal';
    modal.innerHTML = `<img src="${src}" alt="Full Resolution Visual" />`;
    modal.addEventListener('click', () => modal.remove());
    document.body.appendChild(modal);
  }

  /* ── 9. HELPER UTILITIES ─────────────────────────────────────────────── */
  function escHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function createExcerpt(text, maxLen) {
    if (!text) return '';
    const clean = text.replace(/\n+/g, ' ').trim();
    if (clean.length <= maxLen) return clean;
    return clean.substring(0, maxLen).trim() + '…';
  }

  function formatPostDate(ts) {
    if (!ts) return 'RECENT';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).toUpperCase();
  }

  function estimateReadTime(text) {
    const words = (text || '').trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} MIN READ`;
  }

  /* Converts plain text/markdown paragraphs into clean HTML prose */
  function formatProseText(text) {
    if (!text) return '';
    
    // Split into paragraph blocks
    const blocks = text.split(/\n\s*\n/);
    return blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';

      // Check if code block
      if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
        const codeContent = trimmed.replace(/^```[a-z]*\n?/, '').replace(/```$/, '');
        return `<pre><code>${escHtml(codeContent)}</code></pre>`;
      }

      // Check if heading (## or ###)
      if (trimmed.startsWith('### ')) {
        return `<h3>${escHtml(trimmed.replace(/^###\s+/, ''))}</h3>`;
      }
      if (trimmed.startsWith('## ')) {
        return `<h2>${escHtml(trimmed.replace(/^##\s+/, ''))}</h2>`;
      }

      // Check if blockquote
      if (trimmed.startsWith('> ')) {
        return `<blockquote>${escHtml(trimmed.replace(/^>\s+/, ''))}</blockquote>`;
      }

      // Standard paragraph with inline formatting
      let formatted = escHtml(trimmed);
      // Bold **text**
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Inline code `code`
      formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
      // Linebreaks
      formatted = formatted.replace(/\n/g, '<br />');

      return `<p>${formatted}</p>`;
    }).join('\n');
  }

  // Update Year
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});
