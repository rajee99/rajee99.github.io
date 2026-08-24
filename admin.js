/* ==========================================================================
   ABDULLAH AL RAJEE — ADMIN CONSOLE ENGINE
   - Firebase Auth Authentication & Session State
   - Cloudinary Media Pipeline (Unsigned Preset)
   - Real-Time CRUD Synchronization (Create, Read, Update, Delete)
   - Full Form State Machine (Compose vs Edit Mode)
   - Theme Toggle Integration
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. THEME TOGGLE ─────────────────────────────────────────────────── */
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

  /* ── 2. CLOUDINARY CONFIGURATION ─────────────────────────────────────── */
  const CLOUDINARY_CLOUD = 'afrxn3rr';
  const CLOUDINARY_PRESET = 'portfolio_blog';

  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Cloudinary upload failed.');
    }

    const data = await res.json();
    return data.secure_url;
  }

  /* ── 3. DOM ELEMENTS ─────────────────────────────────────────────────── */
  const loginPanel = document.getElementById('admin-login-panel');
  const dashboardPanel = document.getElementById('admin-dashboard-panel');
  const userBadge = document.getElementById('admin-user-badge');
  const logoutBtn = document.getElementById('admin-logout-btn');
  const userEmailLabel = document.getElementById('admin-user-email-label');

  const loginForm = document.getElementById('admin-login-form');
  const loginEmailInput = document.getElementById('login-email');
  const loginPasswordInput = document.getElementById('login-password');
  const loginErrorBanner = document.getElementById('login-error-banner');
  const btnLoginSubmit = document.getElementById('btn-login-submit');

  const postEditorForm = document.getElementById('post-editor-form');
  const editingPostId = document.getElementById('editing-post-id');
  const composerModeTitle = document.getElementById('composer-mode-title');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const postTitleInput = document.getElementById('post-title-input');
  const postTagInput = document.getElementById('post-tag-input');
  const postBodyInput = document.getElementById('post-body-input');
  const postImageUrlInput = document.getElementById('post-image-url-input');
  const adminCharCounter = document.getElementById('admin-char-counter');
  const postStatusBanner = document.getElementById('post-status-banner');
  const btnPublishSubmit = document.getElementById('btn-publish-submit');
  const btnSubmitLabel = document.getElementById('btn-submit-label');

  const adminDropZone = document.getElementById('admin-drop-zone');
  const fileInputControl = document.getElementById('file-input-control');
  const adminPreviewContainer = document.getElementById('admin-preview-container');
  const adminPreviewImg = document.getElementById('admin-preview-img');
  const btnRemoveAttachment = document.getElementById('btn-remove-attachment');

  const adminEntriesFeed = document.getElementById('admin-entries-feed');
  const adminTotalPostsCount = document.getElementById('admin-total-posts-count');

  let selectedImageFile = null;
  let currentLoadedPosts = [];

  /* ── 4. FIREBASE AUTH STATE MONITOR ──────────────────────────────────── */
  if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
      if (user) {
        loginPanel.style.display = 'none';
        dashboardPanel.style.display = 'block';
        userBadge.style.display = 'inline-block';
        logoutBtn.style.display = 'inline-block';
        userEmailLabel.textContent = `AUTHENTICATED AS ${user.email.toUpperCase()}`;
        
        loadAdminPosts();
      } else {
        loginPanel.style.display = 'block';
        dashboardPanel.style.display = 'none';
        userBadge.style.display = 'none';
        logoutBtn.style.display = 'none';
      }
    });
  }

  /* ── 5. AUTHENTICATION (SIGN IN & OUT) ───────────────────────────────── */
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginErrorBanner.style.display = 'none';
      btnLoginSubmit.disabled = true;
      btnLoginSubmit.innerHTML = '<span>AUTHENTICATING…</span>';

      try {
        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value;
        await auth.signInWithEmailAndPassword(email, password);
      } catch (err) {
        console.error('Auth Login Error:', err);
        loginErrorBanner.textContent = mapAuthError(err.code);
        loginErrorBanner.style.display = 'block';
        btnLoginSubmit.disabled = false;
        btnLoginSubmit.innerHTML = '<span>AUTHENTICATE &amp; ENTER</span> <span>→</span>';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.signOut().then(() => {
        resetComposerForm();
      });
    });
  }

  function mapAuthError(code) {
    const errorMap = {
      'auth/wrong-password': 'The password you entered is incorrect.',
      'auth/user-not-found': 'No registered administrator found with this email.',
      'auth/invalid-email': 'Please specify a valid email address.',
      'auth/too-many-requests': 'Too many unsuccessful attempts. Access temporarily restricted.',
      'auth/invalid-credential': 'Invalid credentials supplied.',
      'auth/network-request-failed': 'Network connection issue. Please verify connectivity.'
    };
    return errorMap[code] || `Authentication failed: ${code}`;
  }

  /* ── 6. IMAGE DROP ZONE & PREVIEW ────────────────────────────────────── */
  if (adminDropZone && fileInputControl) {
    adminDropZone.addEventListener('click', () => fileInputControl.click());

    fileInputControl.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleFileSelection(file);
      fileInputControl.value = '';
    });

    adminDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      adminDropZone.style.borderColor = 'var(--border-strong)';
    });

    adminDropZone.addEventListener('dragleave', () => {
      adminDropZone.style.borderColor = '';
    });

    adminDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      adminDropZone.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleFileSelection(file);
      }
    });
  }

  function handleFileSelection(file) {
    selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      adminPreviewImg.src = e.target.result;
      adminPreviewContainer.style.display = 'block';
      postImageUrlInput.value = ''; // clear manual URL
    };
    reader.readAsDataURL(file);
  }

  if (postImageUrlInput) {
    postImageUrlInput.addEventListener('input', () => {
      const val = postImageUrlInput.value.trim();
      if (val) {
        selectedImageFile = null;
        adminPreviewImg.src = val;
        adminPreviewContainer.style.display = 'block';
      } else if (!selectedImageFile) {
        adminPreviewContainer.style.display = 'none';
      }
    });
  }

  if (btnRemoveAttachment) {
    btnRemoveAttachment.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedImageFile = null;
      adminPreviewImg.src = '';
      adminPreviewContainer.style.display = 'none';
      postImageUrlInput.value = '';
    });
  }

  /* ── 7. CHARACTER COUNTER ────────────────────────────────────────────── */
  if (postBodyInput && adminCharCounter) {
    postBodyInput.addEventListener('input', () => {
      const count = postBodyInput.value.length;
      adminCharCounter.textContent = `${count} characters · ~${Math.max(1, Math.ceil(count / 1000))} min read`;
    });
  }

  /* ── 8. POST CREATION & EDITING ──────────────────────────────────────── */
  if (postEditorForm) {
    postEditorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      postStatusBanner.style.display = 'none';

      const title = postTitleInput.value.trim();
      const body = postBodyInput.value.trim();
      const tag = postTagInput.value.trim() || 'TECHNICAL NOTE';
      const manualUrl = postImageUrlInput.value.trim();
      const targetId = editingPostId.value;

      if (!title || !body) {
        showPostStatus('Please provide both a title and article body.', 'error');
        return;
      }

      btnPublishSubmit.disabled = true;
      btnSubmitLabel.textContent = 'TRANSMITTING TO CLOUD…';

      try {
        let finalImageUrl = manualUrl || null;

        // Upload file to Cloudinary if new file selected
        if (selectedImageFile) {
          btnSubmitLabel.textContent = 'UPLOADING VISUAL ATTACHMENT…';
          finalImageUrl = await uploadToCloudinary(selectedImageFile);
        } else if (adminPreviewImg.src && !selectedImageFile && !manualUrl && targetId) {
          // Keep existing image during edit
          finalImageUrl = adminPreviewImg.src;
        }

        btnSubmitLabel.textContent = 'COMMITTING TO FIRESTORE…';

        const user = auth.currentUser;
        const postData = {
          title,
          body,
          tag,
          category: tag,
          image: finalImageUrl,
          authorEmail: user ? user.email : 'rajee0585@gmail.com',
          authorName: 'Abdullah Al Rajee',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (targetId) {
          // UPDATE EXISTING POST
          await db.collection('posts').doc(targetId).update(postData);
          showPostStatus(`Journal entry "${title}" successfully updated!`, 'success');
        } else {
          // CREATE NEW POST
          postData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          await db.collection('posts').add(postData);
          showPostStatus(`Journal entry "${title}" published live!`, 'success');
        }

        resetComposerForm();
      } catch (err) {
        console.error('Save Post Error:', err);
        showPostStatus(`Failed to commit post: ${err.message}`, 'error');
      } finally {
        btnPublishSubmit.disabled = false;
        btnSubmitLabel.textContent = targetId ? 'UPDATE JOURNAL ENTRY' : 'PUBLISH JOURNAL ENTRY';
      }
    });
  }

  function showPostStatus(msg, type) {
    postStatusBanner.className = `admin-alert-banner ${type}`;
    postStatusBanner.textContent = msg;
    postStatusBanner.style.display = 'block';
  }

  function resetComposerForm() {
    editingPostId.value = '';
    postTitleInput.value = '';
    postTagInput.value = '';
    postBodyInput.value = '';
    postImageUrlInput.value = '';
    selectedImageFile = null;
    adminPreviewImg.src = '';
    adminPreviewContainer.style.display = 'none';
    adminCharCounter.textContent = '0 characters';
    composerModeTitle.textContent = 'Compose Journal Entry';
    btnSubmitLabel.textContent = 'PUBLISH JOURNAL ENTRY';
    btnCancelEdit.style.display = 'none';
  }

  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', () => {
      resetComposerForm();
      postStatusBanner.style.display = 'none';
    });
  }

  /* ── 9. REAL-TIME ADMIN POSTS STREAM & MANAGEMENT ────────────────────── */
  function loadAdminPosts() {
    db.collection('posts')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        if (snapshot.empty) {
          adminEntriesFeed.innerHTML = '<p style="color:var(--text-muted); font-family:var(--font-mono); font-size:0.85rem; padding:2rem 0; text-align:center;">No published entries in Firestore.</p>';
          adminTotalPostsCount.textContent = '0 ENTRIES';
          return;
        }

        adminTotalPostsCount.textContent = `${snapshot.size} ${snapshot.size === 1 ? 'ENTRY' : 'ENTRIES'}`;
        adminEntriesFeed.innerHTML = '';
        currentLoadedPosts = [];

        snapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          currentLoadedPosts.push(data);

          const item = document.createElement('div');
          item.className = 'admin-post-item';

          const formattedDate = formatTimestamp(data.createdAt);

          item.innerHTML = `
            ${data.image ? `<img src="${data.image}" alt="" class="admin-post-thumb-img" />` : ''}
            <div style="flex:1; min-width:0;">
              <h3 class="admin-item-title">${escHtml(data.title || 'Untitled')}</h3>
              <div class="admin-item-date">${formattedDate} · ${escHtml(data.tag || 'NOTE')}</div>
            </div>
            <div class="admin-item-actions">
              <a href="blog.html?id=${encodeURIComponent(data.id)}" target="_blank" class="btn-admin-action" title="View Public Article">View ↗</a>
              <button class="btn-admin-action btn-edit" data-id="${data.id}" title="Edit Article">Edit</button>
              <button class="btn-admin-action delete btn-delete" data-id="${data.id}" title="Delete Article">✕</button>
            </div>
          `;

          adminEntriesFeed.appendChild(item);
        });

        // Bind Edit Actions
        adminEntriesFeed.querySelectorAll('.btn-edit').forEach((btn) => {
          btn.addEventListener('click', () => {
            const post = currentLoadedPosts.find(p => p.id === btn.dataset.id);
            if (post) populateEditorForEdit(post);
          });
        });

        // Bind Delete Actions
        adminEntriesFeed.querySelectorAll('.btn-delete').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const post = currentLoadedPosts.find(p => p.id === btn.dataset.id);
            const title = post ? post.title : 'this entry';
            if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;

            btn.disabled = true;
            btn.textContent = '…';

            try {
              await db.collection('posts').doc(btn.dataset.id).delete();
              if (editingPostId.value === btn.dataset.id) {
                resetComposerForm();
              }
            } catch (err) {
              alert(`Failed to delete: ${err.message}`);
              btn.disabled = false;
              btn.textContent = '✕';
            }
          });
        });
      }, (err) => {
        console.error('Admin stream error:', err);
      });
  }

  function populateEditorForEdit(post) {
    editingPostId.value = post.id;
    postTitleInput.value = post.title || '';
    postTagInput.value = post.tag || post.category || '';
    postBodyInput.value = post.body || '';
    
    selectedImageFile = null;
    if (post.image) {
      adminPreviewImg.src = post.image;
      adminPreviewContainer.style.display = 'block';
      postImageUrlInput.value = post.image;
    } else {
      adminPreviewContainer.style.display = 'none';
      postImageUrlInput.value = '';
    }

    composerModeTitle.textContent = `Edit: "${post.title || 'Untitled'}"`;
    btnSubmitLabel.textContent = 'UPDATE JOURNAL ENTRY';
    btnCancelEdit.style.display = 'inline-block';
    
    // Scroll smoothly to composer
    postTitleInput.focus();
    postTitleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ── 10. UTILITIES ───────────────────────────────────────────────────── */
  function escHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function formatTimestamp(ts) {
    if (!ts) return 'RECENT';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});
