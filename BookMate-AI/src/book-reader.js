/**
 * PDF Book Reader using PDF.js
 * Features: page nav, zoom, fullscreen, search, progress, bookmarks
 */

import * as pdfjsLib from 'pdfjs-dist';

// Use CDN worker for Vite compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

let pdfDoc = null;
let currentPage = 1;
let scale = 1.2;
let renderTask = null;
let currentBookMeta = null;

const canvas = () => document.getElementById('pdf-canvas');
const pageInfo = () => document.getElementById('page-info');
const progressBar = () => document.getElementById('progress-bar');
const titleEl = () => document.getElementById('reader-title');

export async function openPDF(source, meta = {}) {
  try {
    // source can be URL string or ArrayBuffer / Uint8Array
    const loadingTask = pdfjsLib.getDocument(source);
    pdfDoc = await loadingTask.promise;
    currentPage = 1;
    currentBookMeta = meta;
    if (titleEl()) titleEl().textContent = meta.title || meta.name || 'Book';

    // Restore bookmark if any
    const bm = getBookmark(meta.id);
    if (bm && bm <= pdfDoc.numPages) currentPage = bm;

    await renderPage(currentPage);
    updateProgress();
    return { ok: true, pages: pdfDoc.numPages };
  } catch (err) {
    console.error('PDF open error:', err);
    return { ok: false, error: err.message };
  }
}

export async function openFromBlob(blob, meta = {}) {
  const buffer = await blob.arrayBuffer();
  return openPDF({ data: buffer }, meta);
}

async function renderPage(num) {
  if (!pdfDoc) return;
  if (renderTask) {
    try { renderTask.cancel(); } catch (_) {}
  }

  const page = await pdfDoc.getPage(num);
  const viewport = page.getViewport({ scale });
  const c = canvas();
  if (!c) return;

  const ctx = c.getContext('2d');
  c.height = viewport.height;
  c.width = viewport.width;

  renderTask = page.render({ canvasContext: ctx, viewport });
  try {
    await renderTask.promise;
  } catch (e) {
    if (e?.name !== 'RenderingCancelledException') throw e;
  }

  currentPage = num;
  if (pageInfo()) pageInfo().textContent = `${num} / ${pdfDoc.numPages}`;
  updateProgress();
}

function updateProgress() {
  if (!pdfDoc || !progressBar()) return;
  const pct = (currentPage / pdfDoc.numPages) * 100;
  progressBar().style.width = `${pct}%`;
}

export function nextPage() {
  if (!pdfDoc || currentPage >= pdfDoc.numPages) return;
  renderPage(currentPage + 1);
}

export function prevPage() {
  if (!pdfDoc || currentPage <= 1) return;
  renderPage(currentPage - 1);
}

export function zoomIn() {
  scale = Math.min(scale + 0.2, 3);
  renderPage(currentPage);
}

export function zoomOut() {
  scale = Math.max(scale - 0.2, 0.5);
  renderPage(currentPage);
}

export function toggleFullscreen() {
  const container = document.getElementById('reader-container');
  if (!document.fullscreenElement) {
    container?.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

export function bookmarkCurrent() {
  if (!currentBookMeta?.id) return;
  const key = `bm_${currentBookMeta.id}`;
  localStorage.setItem(key, String(currentPage));
  return currentPage;
}

function getBookmark(id) {
  if (!id) return null;
  const v = localStorage.getItem(`bm_${id}`);
  return v ? Number(v) : null;
}

/**
 * Extract text from a range of pages (for AI / search)
 */
export async function extractText(startPage = 1, endPage = null) {
  if (!pdfDoc) return '';
  const end = endPage || Math.min(startPage + 4, pdfDoc.numPages);
  const parts = [];
  for (let i = startPage; i <= end; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(it => it.str).join(' ');
    parts.push(`[Page ${i}]\n${text}`);
  }
  return parts.join('\n\n');
}

/**
 * Search within current PDF
 */
export async function searchInBook(query) {
  if (!pdfDoc || !query) return [];
  const results = [];
  const q = query.toLowerCase();
  const maxPages = Math.min(pdfDoc.numPages, 80); // limit for performance

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(it => it.str).join(' ');
    if (text.toLowerCase().includes(q)) {
      const idx = text.toLowerCase().indexOf(q);
      const snippet = text.substring(Math.max(0, idx - 40), idx + query.length + 60).trim();
      results.push({ page: i, snippet: '…' + snippet + '…' });
      if (results.length >= 20) break;
    }
  }
  return results;
}

export function goToPage(num) {
  if (!pdfDoc || num < 1 || num > pdfDoc.numPages) return;
  renderPage(num);
}

export function getCurrentMeta() {
  return currentBookMeta;
}

export function closeReader() {
  pdfDoc = null;
  currentPage = 1;
  currentBookMeta = null;
  const c = canvas();
  if (c) {
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
  }
}

export function isOpen() {
  return !!pdfDoc;
}
