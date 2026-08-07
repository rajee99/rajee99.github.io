/* ============================================================
   ADMIN PANEL JAVASCRIPT — admin.js
   Firebase Auth + Firestore + Cloudinary image upload
   ============================================================ */

/* ---- CLOUDINARY CONFIG ---- */
const CLOUDINARY_CLOUD  = 'afrxn3rr';
const CLOUDINARY_PRESET = 'portfolio_blog'; // ⚠️ Replace with your unsigned preset name

/* ---- UPLOAD IMAGE TO CLOUDINARY ---- */
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
    throw new Error(err.error?.message || 'Cloudinary upload failed');
  }

  const data = await res.json();
  return data.secure_url;
}

/* ---- LOCAL PREVIEW (compress before upload) ---- */
function readAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

/* ---- STATE ---- */
let selectedFile = null; // File object waiting to be uploaded

/* ---- ELEMENTS ---- */
const loginScreen     = document.getElementById('login-screen');
const adminScreen     = document.getElementById('admin-screen');
const loginForm       = document.getElementById('login-form');
const loginError      = document.getElementById('login-error');
const loginBtn        = document.getElementById('login-btn');
const logoutBtn       = document.getElementById('logout-btn');
const postForm        = document.getElementById('post-form');
const postTitle       = document.getElementById('post-title');
const postBody        = document.getElementById('post-body');
const postError       = document.getElementById('post-error');
const postBtn         = document.getElementById('post-btn');
const charCount       = document.getElementById('char-count');
const adminPostsList  = document.getElementById('admin-posts-list');
const imageInput      = document.getElementById('image-input');
const imageUploadArea = document.getElementById('image-upload-area');
const imagePreview    = document.getElementById('image-preview');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const removeImageBtn  = document.getElementById('remove-image-btn');

/* ---- AUTH STATE ---- */
auth.onAuthStateChanged((user) => {
  if (user) {
    loginScreen.style.display = 'none';
    adminScreen.style.display = 'flex';
    logoutBtn.style.display   = 'block';
    loadAdminPosts();
  } else {
    loginScreen.style.display = 'flex';
    adminScreen.style.display = 'none';
    logoutBtn.style.display   = 'none';
  }
});

/* ---- LOGIN ---- */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';
  loginBtn.textContent = 'Signing in…';
  loginBtn.disabled = true;

  try {
    const email    = document.getElementById('email-input').value.trim();
    const password = document.getElementById('password-input').value;
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    loginError.textContent  = getAuthError(err.code);
    loginError.style.display = 'block';
    loginBtn.textContent = 'Sign In';
    loginBtn.disabled = false;
  }
});

function getAuthError(code) {
  const map = {
    'auth/wrong-password':     'Incorrect password.',
    'auth/user-not-found':     'No account found with this email.',
    'auth/invalid-email':      'Please enter a valid email.',
    'auth/too-many-requests':  'Too many attempts. Try again later.',
    'auth/invalid-credential': 'Invalid email or password.',
  };
  return map[code] || 'Sign in failed. Please try again.';
}

/* ---- LOGOUT ---- */
logoutBtn.addEventListener('click', () => auth.signOut());

/* ---- IMAGE SELECT (shows local preview instantly) ---- */
imageUploadArea.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  showImagePreview(file);
  imageInput.value = '';
});

async function showImagePreview(file) {
  selectedFile = file;
  uploadPlaceholder.style.display = 'none';
  const dataUrl = await readAsDataURL(file);
  imagePreview.src = dataUrl;
  imagePreview.style.display = 'block';
  removeImageBtn.style.display = 'block';
}

/* ---- DRAG & DROP ---- */
imageUploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  imageUploadArea.style.borderColor = 'var(--accent-cyan)';
});
imageUploadArea.addEventListener('dragleave', () => {
  imageUploadArea.style.borderColor = '';
});
imageUploadArea.addEventListener('drop', async (e) => {
  e.preventDefault();
  imageUploadArea.style.borderColor = '';
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) showImagePreview(file);
});

/* ---- REMOVE IMAGE ---- */
removeImageBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  selectedFile = null;
  imagePreview.src = '';
  imagePreview.style.display  = 'none';
  removeImageBtn.style.display = 'none';
  uploadPlaceholder.style.display = 'flex';
});

/* ---- CHAR COUNTER ---- */
postBody.addEventListener('input', () => {
  charCount.textContent = `${postBody.value.length} / 2000`;
  charCount.style.color = postBody.value.length > 1800 ? '#fca5a5' : 'var(--text-muted)';
});

/* ---- CREATE POST ---- */
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  postError.style.display = 'none';

  const title = postTitle.value.trim();
  const body  = postBody.value.trim();

  if (!body && !selectedFile) {
    showPostError('Please write something or add a photo.');
    return;
  }

  postBtn.textContent = 'Uploading…';
  postBtn.disabled = true;

  try {
    /* Upload image to Cloudinary first (if any) */
    let imageUrl = null;
    if (selectedFile) {
      postBtn.textContent = '📤 Uploading image…';
      imageUrl = await uploadToCloudinary(selectedFile);
    }

    postBtn.textContent = '💾 Saving post…';

    const user = auth.currentUser;
    await db.collection('posts').add({
      title:       title    || '',
      body:        body     || '',
      image:       imageUrl || null,
      authorId:    user.uid,
      authorEmail: user.email,
      createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
    });

    /* Reset form */
    postTitle.value = '';
    postBody.value  = '';
    charCount.textContent = '0 / 2000';
    selectedFile = null;
    imagePreview.src = '';
    imagePreview.style.display  = 'none';
    removeImageBtn.style.display = 'none';
    uploadPlaceholder.style.display = 'flex';

    postBtn.textContent = '✅ Published!';
    setTimeout(() => {
      postBtn.textContent = '🚀 Publish Post';
      postBtn.disabled = false;
    }, 2000);

  } catch (err) {
    showPostError('Failed to publish. ' + err.message);
    postBtn.textContent = '🚀 Publish Post';
    postBtn.disabled = false;
  }
});

function showPostError(msg) {
  postError.textContent    = msg;
  postError.style.display  = 'block';
}

/* ---- LOAD ADMIN POSTS (real-time) ---- */
function loadAdminPosts() {
  db.collection('posts')
    .orderBy('createdAt', 'desc')
    .onSnapshot((snapshot) => {
      if (snapshot.empty) {
        adminPostsList.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem;">No posts yet. Write your first one above!</p>';
        return;
      }

      adminPostsList.innerHTML = '';

      snapshot.forEach((doc) => {
        const d   = doc.data();
        const div = document.createElement('div');
        div.className = 'admin-post-item';

        div.innerHTML = `
          ${d.image ? `<img class="admin-post-thumb" src="${d.image}" alt="" />` : ''}
          <div class="admin-post-body">
            ${d.title ? `<div class="admin-post-title">${escHtml(d.title)}</div>` : ''}
            <div class="admin-post-preview">${escHtml(d.body || '(photo only)')}</div>
            <div class="admin-post-meta">${formatDate(d.createdAt)}</div>
          </div>
          <div class="admin-post-actions">
            <button class="delete-btn" data-id="${doc.id}">🗑 Delete</button>
          </div>
        `;

        adminPostsList.appendChild(div);
      });

      /* Attach delete handlers */
      adminPostsList.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this post? This cannot be undone.')) return;
          btn.textContent = '…';
          btn.disabled = true;
          try {
            await db.collection('posts').doc(btn.dataset.id).delete();
          } catch (err) {
            alert('Failed to delete: ' + err.message);
            btn.textContent = '🗑 Delete';
            btn.disabled = false;
          }
        });
      });
    });
}

/* ---- UTILS ---- */
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function formatDate(ts) {
  if (!ts) return 'just now';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
