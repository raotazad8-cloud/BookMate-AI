/**
 * Curriculum loader & update checker
 * Loads /data/curriculum.json dynamically. No hard-coded books.
 */

const CURRICULUM_URL = '/data/curriculum.json';
const STORAGE_KEY = 'bookmate_curriculum_cache';
const VERSION_KEY = 'bookmate_curriculum_version';

let curriculum = null;

export async function loadCurriculum(force = false) {
  try {
    const res = await fetch(CURRICULUM_URL + (force ? `?t=${Date.now()}` : ''), {
      cache: force ? 'no-store' : 'default'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    curriculum = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(VERSION_KEY, data.version || '0');
    localStorage.setItem('bookmate_last_checked', new Date().toISOString());
    return { ok: true, data, fromCache: false };
  } catch (err) {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      curriculum = JSON.parse(cached);
      return { ok: true, data: curriculum, fromCache: true, error: err.message };
    }
    return { ok: false, error: err.message };
  }
}

export function getCurriculum() {
  return curriculum;
}

export function getClasses() {
  return curriculum?.classes || [];
}

export function getClass(classNum) {
  return (curriculum?.classes || []).find(c => c.class === Number(classNum));
}

export function findBook(id) {
  for (const cls of curriculum?.classes || []) {
    const sub = cls.subjects?.find(s => s.id === id);
    if (sub) return { ...sub, classNum: cls.class };
  }
  return null;
}

export function searchBooks(query) {
  if (!query || !curriculum) return [];
  const q = query.toLowerCase().trim();
  const results = [];
  for (const cls of curriculum.classes || []) {
    for (const sub of cls.subjects || []) {
      const name = (sub.name || '').toLowerCase();
      const nameBn = (sub.nameBn || '').toLowerCase();
      if (name.includes(q) || nameBn.includes(q) || String(cls.class).includes(q)) {
        results.push({ ...sub, classNum: cls.class });
      }
    }
  }
  return results;
}

export function getLastChecked() {
  return localStorage.getItem('bookmate_last_checked') || '';
}

export function getCachedVersion() {
  return localStorage.getItem(VERSION_KEY) || '';
}

/**
 * Check for newer version (compares local cache vs remote).
 * Does NOT invent official NCTB updates.
 */
export async function checkForUpdates() {
  try {
    const res = await fetch(CURRICULUM_URL + `?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return { hasUpdate: false, error: `HTTP ${res.status}` };
    const remote = await res.json();
    const localVer = getCachedVersion();
    const hasUpdate = remote.version && remote.version !== localVer;
    localStorage.setItem('bookmate_last_checked', new Date().toISOString());
    return {
      hasUpdate,
      remoteVersion: remote.version,
      localVersion: localVer,
      currentYear: remote.currentYear,
      lastChecked: new Date().toISOString()
    };
  } catch (err) {
    return { hasUpdate: false, error: err.message, offline: true };
  }
}

/**
 * Export current in-memory curriculum as downloadable JSON
 * (Admin workflow — no direct GitHub write from frontend)
 */
export function exportCurriculumJSON() {
  if (!curriculum) return null;
  const blob = new Blob([JSON.stringify(curriculum, null, 2)], { type: 'application/json' });
  return URL.createObjectURL(blob);
}

/**
 * Mutate local curriculum copy (for admin UI). Call export to download.
 */
export function addBookEntry(entry) {
  if (!curriculum) return false;
  let cls = curriculum.classes.find(c => c.class === entry.classNum);
  if (!cls) {
    cls = { class: entry.classNum, subjects: [] };
    curriculum.classes.push(cls);
    curriculum.classes.sort((a, b) => a.class - b.class);
  }
  const id = `class-${entry.classNum}-${(entry.name || 'book').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  cls.subjects.push({
    id,
    name: entry.name,
    nameBn: entry.nameBn || entry.name,
    language: entry.language || 'bn',
    year: entry.year || curriculum.currentYear,
    file: entry.file,
    status: 'example'
  });
  return true;
}

export function getAdminCurriculum() {
  return curriculum;
}
