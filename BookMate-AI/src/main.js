/**
 * BookMate AI — NCTB Edition
 * Main application entry
 */

import {
  loadCurriculum,
  getCurriculum,
  getClasses,
  getClass,
  findBook,
  searchBooks,
  checkForUpdates,
  getLastChecked,
  exportCurriculumJSON,
  addBookEntry,
  getAdminCurriculum
} from './curriculum.js';

import {
  openPDF,
  openFromBlob,
  nextPage,
  prevPage,
  zoomIn,
  zoomOut,
  toggleFullscreen,
  bookmarkCurrent,
  searchInBook,
  goToPage,
  closeReader,
  isOpen
} from './book-reader.js';

import { ask, tryLoadLocalModel, isModelReady } from './ai-assistant.js';

/* ---------- i18n ---------- */
const i18n = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.library': 'NCTB Library',
    'nav.myLibrary': 'My Library',
    'nav.upload': 'Upload Book',
    'nav.ai': 'AI Assistant',
    'nav.admin': 'Admin',
    'dashboard.welcome': 'Welcome to BookMate AI',
    'dashboard.subtitle': 'Your offline-first NCTB book companion for Class 1–12',
    'dashboard.classSelect': 'Select Class',
    'dashboard.recent': 'Recently Opened',
    'dashboard.updates': 'Curriculum Status',
    'search.placeholder': 'Search books, subjects…',
    'search.filter': 'Filter books…',
    'actions.browse': 'Browse NCTB',
    'actions.upload': 'Upload Book',
    'actions.ai': 'Ask AI',
    'actions.myBooks': 'My Books',
    'library.title': 'NCTB Book Library',
    'library.subtitle': 'Class 1 – 12 · Official curriculum books',
    'myLibrary.title': 'My Library',
    'myLibrary.subtitle': 'Books you uploaded (stored locally)',
    'upload.title': 'Upload Book',
    'upload.subtitle': 'Store PDF or TXT files locally in your browser',
    'upload.file': 'Select File (PDF or TXT, max 50 MB)',
    'upload.titleLabel': 'Book Title',
    'upload.class': 'Class',
    'upload.subject': 'Subject',
    'upload.language': 'Language',
    'upload.submit': 'Upload & Save Locally',
    'upload.hint': 'Files stay on this device only. They are never sent to any server.',
    'ai.title': 'AI Assistant',
    'ai.subtitle': 'Ask questions about the currently open book',
    'ai.fallback': 'Book-search mode (local AI model not loaded)',
    'ai.placeholder': 'Ask about the book…',
    'ai.hint': 'Answers use book text search when the local model is unavailable. No private content is sent externally without permission.',
    'admin.title': 'Admin — Catalog Manager',
    'admin.subtitle': 'Edit curriculum.json locally, then download & publish via GitHub',
    'admin.warningTitle': 'Important:',
    'admin.warning': 'This is a static site. Changes are not saved to GitHub automatically. Download the updated JSON and commit it to your repository.',
    'admin.add': 'Add Entry',
    'admin.download': 'Download curriculum.json',
    'admin.validate': 'Validate Missing Files',
    'status.version': 'Version:',
    'status.year': 'Academic Year:',
    'status.lastChecked': 'Last Checked:',
    'status.refresh': 'Refresh Catalog',
    'empty.recent': 'No recently opened books yet.',
    'empty.myBooks': 'No uploaded books yet. Upload a PDF or TXT file.',
    'loading': 'Loading catalog…',
    'offline': 'You are offline. Cached books remain available.'
  },
  bn: {
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.library': 'এনসিটিবি লাইব্রেরি',
    'nav.myLibrary': 'আমার লাইব্রেরি',
    'nav.upload': 'বই আপলোড',
    'nav.ai': 'এআই সহকারী',
    'nav.admin': 'অ্যাডমিন',
    'dashboard.welcome': 'BookMate AI-তে স্বাগতম',
    'dashboard.subtitle': 'ক্লাস ১–১২ এর জন্য অফলাইন এনসিটিবি বই সঙ্গী',
    'dashboard.classSelect': 'ক্লাস নির্বাচন',
    'dashboard.recent': 'সম্প্রতি খোলা',
    'dashboard.updates': 'কারিকুলাম স্ট্যাটাস',
    'search.placeholder': 'বই, বিষয় খুঁজুন…',
    'search.filter': 'বই ফিল্টার…',
    'actions.browse': 'এনসিটিবি দেখুন',
    'actions.upload': 'বই আপলোড',
    'actions.ai': 'এআই জিজ্ঞাসা',
    'actions.myBooks': 'আমার বই',
    'library.title': 'এনসিটিবি বই লাইব্রেরি',
    'library.subtitle': 'ক্লাস ১ – ১২ · অফিসিয়াল কারিকুলাম বই',
    'myLibrary.title': 'আমার লাইব্রেরি',
    'myLibrary.subtitle': 'আপনার আপলোড করা বই (লোকালি সংরক্ষিত)',
    'upload.title': 'বই আপলোড',
    'upload.subtitle': 'PDF বা TXT ফাইল ব্রাউজারে লোকালি সংরক্ষণ করুন',
    'upload.file': 'ফাইল নির্বাচন (PDF বা TXT, সর্বোচ্চ ৫০ MB)',
    'upload.titleLabel': 'বইয়ের নাম',
    'upload.class': 'ক্লাস',
    'upload.subject': 'বিষয়',
    'upload.language': 'ভাষা',
    'upload.submit': 'আপলোড ও সংরক্ষণ',
    'upload.hint': 'ফাইল শুধু এই ডিভাইসে থাকে। কোনো সার্ভারে পাঠানো হয় না।',
    'ai.title': 'এআই সহকারী',
    'ai.subtitle': 'বর্তমানে খোলা বই সম্পর্কে প্রশ্ন করুন',
    'ai.fallback': 'বই-সার্চ মোড (লোকাল এআই মডেল লোড হয়নি)',
    'ai.placeholder': 'বই সম্পর্কে জিজ্ঞাসা করুন…',
    'ai.hint': 'লোকাল মডেল না থাকলে বইয়ের টেক্সট সার্চ ব্যবহার হয়। অনুমতি ছাড়া ব্যক্তিগত তথ্য বাইরে যায় না।',
    'admin.title': 'অ্যাডমিন — ক্যাটালগ ম্যানেজার',
    'admin.subtitle': 'লোকালি curriculum.json সম্পাদনা করে ডাউনলোড ও GitHub-এ প্রকাশ করুন',
    'admin.warningTitle': 'গুরুত্বপূর্ণ:',
    'admin.warning': 'এটি স্ট্যাটিক সাইট। পরিবর্তন স্বয়ংক্রিয়ভাবে GitHub-এ সেভ হয় না। আপডেটেড JSON ডাউনলোড করে রিপোজিটরিতে কমিট করুন।',
    'admin.add': 'এন্ট্রি যোগ',
    'admin.download': 'curriculum.json ডাউনলোড',
    'admin.validate': 'মিসিং ফাইল যাচাই',
    'status.version': 'ভার্সন:',
    'status.year': 'শিক্ষাবর্ষ:',
    'status.lastChecked': 'সর্বশেষ চেক:',
    'status.refresh': 'ক্যাটালগ রিফ্রেশ',
    'empty.recent': 'এখনো কোনো বই খোলা হয়নি।',
    'empty.myBooks': 'এখনো কোনো বই আপলোড করা হয়নি।',
    'loading': 'ক্যাটালগ লোড হচ্ছে…',
    'offline': 'আপনি অফলাইন। ক্যাশ করা বই উপলব্ধ।'
  }
};

let currentLang = localStorage.getItem('bookmate_lang') || 'en';

function t(key) {
  return i18n[currentLang]?.[key] || i18n.en[key] || key;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.documentElement.lang = currentLang === 'bn' ? 'bn' : 'en';
}

/* ---------- IndexedDB for user books ---------- */
const DB_NAME = 'BookMateAI';
const DB_VERSION = 1;
const STORE = 'books';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveUserBook(book) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(book);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllUserBooks() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deleteUserBook(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getUserBook(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/* ---------- Recent books ---------- */
function addRecent(meta) {
  let list = JSON.parse(localStorage.getItem('bookmate_recent') || '[]');
  list = list.filter(b => b.id !== meta.id);
  list.unshift({ ...meta, openedAt: Date.now() });
  list = list.slice(0, 12);
  localStorage.setItem('bookmate_recent', JSON.stringify(list));
  renderRecent();
}

function getRecent() {
  return JSON.parse(localStorage.getItem('bookmate_recent') || '[]');
}

/* ---------- Theme ---------- */
function initTheme() {
  const saved = localStorage.getItem('bookmate_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('bookmate_theme', next);
}

/* ---------- Navigation ---------- */
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById(`view-${name}`);
  if (view) view.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === name);
  });

  // Close mobile sidebar
  document.getElementById('sidebar')?.classList.remove('open');

  if (name === 'library') renderLibrary();
  if (name === 'my-library') renderMyLibrary();
  if (name === 'dashboard') {
    renderClassGrid();
    renderRecent();
    updateStatusCard();
  }
  if (name === 'admin') populateAdminClass();
}

/* ---------- UI Helpers ---------- */
function toast(msg, ms = 2800) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), ms);
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ---------- Renderers ---------- */
function renderClassGrid() {
  const grid = document.getElementById('class-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement('button');
    btn.className = 'class-btn';
    btn.innerHTML = `${i}<span>Class</span>`;
    btn.addEventListener('click', () => {
      showView('library');
      const sel = document.getElementById('filter-class');
      if (sel) {
        sel.value = String(i);
        renderLibrary();
      }
    });
    grid.appendChild(btn);
  }
}

function renderRecent() {
  const container = document.getElementById('recent-books');
  if (!container) return;
  const list = getRecent();
  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state">${t('empty.recent')}</div>`;
    return;
  }
  container.innerHTML = list.map(b => `
    <div class="book-card glass" data-id="${escapeHtml(b.id)}" data-source="${b.source || 'nctb'}">
      <span class="badge ${b.source === 'user' ? 'user' : 'example'}">${b.source === 'user' ? 'My Book' : 'NCTB'}</span>
      <h3>${escapeHtml(b.title || b.name)}</h3>
      <div class="meta">Class ${b.classNum || '—'} · ${b.language || ''}</div>
      <div class="actions">
        <button class="btn primary open-btn">Open</button>
      </div>
    </div>
  `).join('');
  container.querySelectorAll('.open-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.book-card');
      openBookById(card.dataset.id, card.dataset.source);
    });
  });
}

function renderLibrary() {
  const content = document.getElementById('library-content');
  if (!content) return;
  const classes = getClasses();
  const filterClass = document.getElementById('filter-class')?.value || '';
  const filterLang = document.getElementById('filter-lang')?.value || '';
  const searchQ = (document.getElementById('library-search')?.value || '').toLowerCase();

  if (!classes.length) {
    content.innerHTML = `<div class="empty-state">${t('loading')}</div>`;
    return;
  }

  let html = '';
  for (const cls of classes) {
    if (filterClass && String(cls.class) !== filterClass) continue;
    const subjects = (cls.subjects || []).filter(s => {
      if (filterLang && s.language !== filterLang) return false;
      if (searchQ) {
        const n = (s.name || '').toLowerCase();
        const nb = (s.nameBn || '').toLowerCase();
        if (!n.includes(searchQ) && !nb.includes(searchQ)) return false;
      }
      return true;
    });
    if (subjects.length === 0) continue;

    html += `<div class="class-section"><h2>Class ${cls.class}</h2><div class="subject-grid">`;
    for (const sub of subjects) {
      const displayName = currentLang === 'bn' && sub.nameBn ? sub.nameBn : sub.name;
      html += `
        <div class="book-card glass" data-id="${escapeHtml(sub.id)}" data-file="${escapeHtml(sub.file || '')}">
          <span class="badge example">${sub.status === 'example' ? 'Example' : 'NCTB'}</span>
          <h3>${escapeHtml(displayName)}</h3>
          <div class="meta">${sub.language === 'bn' ? 'বাংলা' : 'English'} · ${sub.year || ''}</div>
          <div class="actions">
            <button class="btn primary open-nctb">Open</button>
          </div>
        </div>`;
    }
    html += `</div></div>`;
  }

  if (!html) {
    html = `<div class="empty-state">No books match your filters. Upload real PDFs to the GitHub repo and update curriculum.json.</div>`;
  }
  content.innerHTML = html;

  content.querySelectorAll('.open-nctb').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.book-card');
      openNctbBook(card.dataset.id, card.dataset.file);
    });
  });
}

async function renderMyLibrary() {
  const container = document.getElementById('my-books-list');
  if (!container) return;
  const books = await getAllUserBooks();
  if (books.length === 0) {
    container.innerHTML = `<div class="empty-state">${t('empty.myBooks')}</div>`;
    return;
  }
  container.innerHTML = books.map(b => `
    <div class="book-card glass" data-id="${escapeHtml(b.id)}">
      <span class="badge user">My Book</span>
      <h3>${escapeHtml(b.title)}</h3>
      <div class="meta">Class ${b.classNum} · ${b.subject || ''} · ${b.language}</div>
      <div class="actions">
        <button class="btn primary open-user">Open</button>
        <button class="btn secondary del-user">Delete</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.open-user').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.closest('.book-card').dataset.id;
      const book = await getUserBook(id);
      if (book) openUserBook(book);
    });
  });
  container.querySelectorAll('.del-user').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.closest('.book-card').dataset.id;
      if (confirm('Delete this book from local storage?')) {
        await deleteUserBook(id);
        renderMyLibrary();
        toast('Book deleted');
      }
    });
  });
}

function updateStatusCard() {
  const cur = getCurriculum();
  if (!cur) return;
  document.getElementById('curr-version').textContent = cur.version || '—';
  document.getElementById('curr-year').textContent = cur.currentYear || '—';
  const checked = getLastChecked();
  document.getElementById('curr-checked').textContent = checked
    ? new Date(checked).toLocaleString()
    : '—';
  document.getElementById('last-checked').textContent = checked
    ? `Checked: ${new Date(checked).toLocaleDateString()}`
    : '';
}

function populateFilters() {
  const sel = document.getElementById('filter-class');
  const uploadSel = document.getElementById('upload-class');
  if (sel) {
    sel.innerHTML = '<option value="">All Classes</option>';
    for (let i = 1; i <= 12; i++) {
      sel.innerHTML += `<option value="${i}">Class ${i}</option>`;
    }
  }
  if (uploadSel) {
    uploadSel.innerHTML = '<option value="">Select</option>';
    for (let i = 1; i <= 12; i++) {
      uploadSel.innerHTML += `<option value="${i}">Class ${i}</option>`;
    }
  }
}

function populateAdminClass() {
  const sel = document.getElementById('admin-class');
  if (!sel) return;
  sel.innerHTML = '';
  for (let i = 1; i <= 12; i++) {
    sel.innerHTML += `<option value="${i}">Class ${i}</option>`;
  }
}

/* ---------- Open books ---------- */
async function openNctbBook(id, filePath) {
  const book = findBook(id);
  const meta = {
    id,
    title: book?.name || id,
    name: book?.name,
    classNum: book?.classNum,
    language: book?.language,
    source: 'nctb',
    file: filePath
  };

  // Friendly empty state for missing example PDFs
  try {
    const res = await fetch(filePath, { method: 'HEAD' });
    if (!res.ok) throw new Error('not found');
  } catch {
    toast('This PDF is not uploaded yet. Replace the example entry with a real file in the GitHub repo.');
    // Still try to open in case of HEAD restriction
  }

  showView('reader');
  const result = await openPDF(filePath, meta);
  if (!result.ok) {
    toast('Could not open PDF: ' + (result.error || 'File missing'));
    showView('library');
    return;
  }
  addRecent(meta);
}

async function openUserBook(book) {
  const meta = {
    id: book.id,
    title: book.title,
    classNum: book.classNum,
    language: book.language,
    source: 'user'
  };
  showView('reader');
  const blob = new Blob([book.data], { type: book.mime || 'application/pdf' });
  const result = await openFromBlob(blob, meta);
  if (!result.ok) {
    toast('Could not open book: ' + result.error);
    showView('my-library');
    return;
  }
  addRecent(meta);
}

async function openBookById(id, source) {
  if (source === 'user') {
    const book = await getUserBook(id);
    if (book) openUserBook(book);
  } else {
    const book = findBook(id);
    if (book) openNctbBook(id, book.file);
  }
}

/* ---------- Upload ---------- */
async function handleUpload(e) {
  e.preventDefault();
  const fileInput = document.getElementById('upload-file');
  const title = document.getElementById('upload-title').value.trim();
  const classNum = Number(document.getElementById('upload-class').value);
  const subject = document.getElementById('upload-subject').value.trim();
  const language = document.getElementById('upload-lang').value;

  if (!fileInput.files?.[0]) {
    toast('Select a file');
    return;
  }
  const file = fileInput.files[0];
  if (file.size > 50 * 1024 * 1024) {
    toast('File too large (max 50 MB)');
    return;
  }
  const validTypes = ['application/pdf', 'text/plain'];
  const validExt = /\.(pdf|txt)$/i.test(file.name);
  if (!validTypes.includes(file.type) && !validExt) {
    toast('Only PDF or TXT allowed');
    return;
  }

  const buffer = await file.arrayBuffer();
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const book = {
    id,
    title: title || file.name,
    classNum,
    subject,
    language,
    mime: file.type || (file.name.endsWith('.txt') ? 'text/plain' : 'application/pdf'),
    data: buffer,
    size: file.size,
    uploadedAt: Date.now()
  };

  await saveUserBook(book);
  toast('Book saved locally');
  fileInput.value = '';
  document.getElementById('upload-title').value = '';
  showView('my-library');
}

/* ---------- AI ---------- */
async function handleAISend() {
  const input = document.getElementById('ai-input');
  const q = input.value.trim();
  if (!q) return;
  input.value = '';

  const messages = document.getElementById('ai-messages');
  messages.innerHTML += `<div class="ai-msg user">${escapeHtml(q)}</div>`;
  messages.scrollTop = messages.scrollHeight;

  const result = await ask(q, currentLang);
  const cls = result.type === 'generate' ? 'bot' : 'bot';
  messages.innerHTML += `<div class="ai-msg ${cls}">${escapeHtml(result.answer).replace(/\n/g, '<br>')}</div>`;
  messages.scrollTop = messages.scrollHeight;
}

/* ---------- Admin ---------- */
function handleAdminAdd() {
  const classNum = Number(document.getElementById('admin-class').value);
  const name = document.getElementById('admin-name').value.trim();
  const nameBn = document.getElementById('admin-name-bn').value.trim();
  const language = document.getElementById('admin-lang').value;
  const year = Number(document.getElementById('admin-year').value) || 2026;
  const file = document.getElementById('admin-file').value.trim();

  if (!name || !file) {
    toast('Name and file path required');
    return;
  }
  addBookEntry({ classNum, name, nameBn, language, year, file });
  const log = document.getElementById('admin-log');
  log.innerHTML += `<div>Added: Class ${classNum} — ${escapeHtml(name)}</div>`;
  toast('Entry added to local catalog (download to publish)');
}

function handleAdminDownload() {
  const url = exportCurriculumJSON();
  if (!url) {
    toast('No curriculum loaded');
    return;
  }
  const a = document.createElement('a');
  a.href = url;
  a.download = 'curriculum.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Downloaded. Commit this file to your GitHub repo.');
}

async function handleAdminValidate() {
  const cur = getAdminCurriculum();
  const log = document.getElementById('admin-log');
  if (!cur) return;
  log.innerHTML = '<div>Checking files…</div>';
  let missing = 0;
  for (const cls of cur.classes || []) {
    for (const sub of cls.subjects || []) {
      try {
        const res = await fetch(sub.file, { method: 'HEAD' });
        if (!res.ok) {
          log.innerHTML += `<div style="color:var(--danger)">Missing: ${escapeHtml(sub.file)}</div>`;
          missing++;
        }
      } catch {
        log.innerHTML += `<div style="color:var(--danger)">Missing: ${escapeHtml(sub.file)}</div>`;
        missing++;
      }
    }
  }
  log.innerHTML += `<div>Done. ${missing} missing file(s).</div>`;
}

/* ---------- Online / Offline ---------- */
function updateOnlineStatus() {
  const online = navigator.onLine;
  const banner = document.getElementById('offline-banner');
  const dot = document.getElementById('online-status');
  if (banner) banner.classList.toggle('hidden', online);
  if (dot) {
    dot.classList.toggle('online', online);
    dot.classList.toggle('offline', !online);
  }
}

/* ---------- Service Worker ---------- */
async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.warn('SW registration failed:', err);
  }
}

/* ---------- Init ---------- */
async function init() {
  initTheme();
  applyI18n();
  populateFilters();
  updateOnlineStatus();

  // Language buttons
  document.getElementById('lang-bn')?.addEventListener('click', () => {
    currentLang = 'bn';
    localStorage.setItem('bookmate_lang', 'bn');
    document.getElementById('lang-bn').classList.add('active');
    document.getElementById('lang-en').classList.remove('active');
    applyI18n();
  });
  document.getElementById('lang-en')?.addEventListener('click', () => {
    currentLang = 'en';
    localStorage.setItem('bookmate_lang', 'en');
    document.getElementById('lang-en').classList.add('active');
    document.getElementById('lang-bn').classList.remove('active');
    applyI18n();
  });
  if (currentLang === 'bn') {
    document.getElementById('lang-bn')?.classList.add('active');
    document.getElementById('lang-en')?.classList.remove('active');
  }

  // Theme
  document.getElementById('theme-btn')?.addEventListener('click', toggleTheme);
  document.getElementById('theme-btn-mobile')?.addEventListener('click', toggleTheme);

  // Nav
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });
  document.getElementById('menu-btn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  // Load curriculum
  const result = await loadCurriculum();
  if (result.ok) {
    updateStatusCard();
    renderClassGrid();
    renderRecent();
  } else {
    toast('Could not load catalog: ' + result.error);
  }

  // Refresh catalog
  document.getElementById('refresh-catalog')?.addEventListener('click', async () => {
    toast('Checking for updates…');
    const check = await checkForUpdates();
    if (check.hasUpdate) {
      await loadCurriculum(true);
      updateStatusCard();
      toast(`New version available: ${check.remoteVersion}`);
    } else if (check.offline) {
      toast('Offline — using cached catalog');
    } else {
      await loadCurriculum(true);
      updateStatusCard();
      toast('Catalog is up to date');
    }
  });

  // Library filters
  document.getElementById('filter-class')?.addEventListener('change', renderLibrary);
  document.getElementById('filter-lang')?.addEventListener('change', renderLibrary);
  document.getElementById('library-search')?.addEventListener('input', renderLibrary);

  // Global search
  document.getElementById('search-btn')?.addEventListener('click', () => {
    const q = document.getElementById('global-search')?.value || '';
    if (!q) return;
    showView('library');
    document.getElementById('library-search').value = q;
    renderLibrary();
  });

  // Upload
  document.getElementById('upload-form')?.addEventListener('submit', handleUpload);

  // AI
  document.getElementById('ai-send')?.addEventListener('click', handleAISend);
  document.getElementById('ai-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAISend();
  });

  // Optional model load (non-blocking)
  tryLoadLocalModel((msg) => {
    const status = document.getElementById('ai-status');
    if (status) status.innerHTML = `<span class="badge warning">${escapeHtml(msg)}</span>`;
  }).then(ok => {
    const status = document.getElementById('ai-status');
    if (status) {
      status.innerHTML = ok
        ? `<span class="badge success">Local AI model ready</span>`
        : `<span class="badge warning">${t('ai.fallback')}</span>`;
    }
  });

  // Admin
  document.getElementById('admin-add')?.addEventListener('click', handleAdminAdd);
  document.getElementById('admin-download')?.addEventListener('click', handleAdminDownload);
  document.getElementById('admin-validate')?.addEventListener('click', handleAdminValidate);

  // Reader controls
  document.getElementById('reader-back')?.addEventListener('click', () => {
    closeReader();
    showView('dashboard');
  });
  document.getElementById('next-page')?.addEventListener('click', nextPage);
  document.getElementById('prev-page')?.addEventListener('click', prevPage);
  document.getElementById('zoom-in')?.addEventListener('click', zoomIn);
  document.getElementById('zoom-out')?.addEventListener('click', zoomOut);
  document.getElementById('fullscreen-btn')?.addEventListener('click', toggleFullscreen);
  document.getElementById('bookmark-btn')?.addEventListener('click', () => {
    const p = bookmarkCurrent();
    if (p) toast(`Bookmarked page ${p}`);
  });
  document.getElementById('search-in-book')?.addEventListener('click', () => {
    document.getElementById('reader-search-panel')?.classList.toggle('hidden');
  });
  document.getElementById('book-search-btn')?.addEventListener('click', async () => {
    const q = document.getElementById('book-search-input')?.value || '';
    const results = await searchInBook(q);
    const box = document.getElementById('search-results');
    if (!box) return;
    if (results.length === 0) {
      box.innerHTML = '<div>No results</div>';
      return;
    }
    box.innerHTML = results.map(r =>
      `<div style="padding:0.4rem 0;cursor:pointer;border-bottom:1px solid var(--glass-border)" data-page="${r.page}">
        <strong>p.${r.page}</strong> ${escapeHtml(r.snippet)}
      </div>`
    ).join('');
    box.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', () => goToPage(Number(el.dataset.page)));
    });
  });

  // Online/offline
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Periodic update check (every 30 min when online)
  setInterval(async () => {
    if (navigator.onLine) {
      const check = await checkForUpdates();
      if (check.hasUpdate) {
        toast(`Curriculum update available (v${check.remoteVersion})`);
      }
    }
  }, 30 * 60 * 1000);

  // Service worker
  registerSW();

  // Keyboard for reader
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'ArrowRight') nextPage();
    if (e.key === 'ArrowLeft') prevPage();
  });
}

init();
