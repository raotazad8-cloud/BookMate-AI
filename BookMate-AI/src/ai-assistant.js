/**
 * AI Assistant
 * - Optional Transformers.js local model (honest about availability)
 * - Always provides labelled book-search fallback
 * - Never pretends keyword search is generative AI
 * - Never sends private content externally without permission
 */

import { extractText, searchInBook, getCurrentMeta } from './book-reader.js';

let modelReady = false;
let modelLoading = false;
let pipeline = null;

/**
 * Attempt to load a lightweight local model via Transformers.js (CDN).
 * This is optional. Failure falls back cleanly to book search.
 */
export async function tryLoadLocalModel(onProgress) {
  if (modelReady || modelLoading) return modelReady;
  modelLoading = true;
  try {
    // Dynamic import from CDN – optional feature
    const { pipeline: createPipeline } = await import(
      'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'
    );
    if (onProgress) onProgress('Downloading model (first time may take a minute)…');
    // Use a very small model suitable for browser
    pipeline = await createPipeline('text-generation', 'Xenova/LaMini-Flan-T5-77M', {
      progress_callback: (p) => {
        if (onProgress && p.status === 'progress') {
          onProgress(`Downloading: ${Math.round(p.progress || 0)}%`);
        }
      }
    });
    modelReady = true;
    modelLoading = false;
    return true;
  } catch (err) {
    console.warn('Local AI model unavailable:', err.message);
    modelLoading = false;
    modelReady = false;
    return false;
  }
}

export function isModelReady() {
  return modelReady;
}

export function isModelLoading() {
  return modelLoading;
}

/**
 * Answer a user question.
 * Returns { type: 'search' | 'generate', answer, references? }
 */
export async function ask(question, lang = 'en') {
  if (!question?.trim()) {
    return { type: 'error', answer: lang === 'bn' ? 'প্রশ্ন লিখুন।' : 'Please type a question.' };
  }

  const meta = getCurrentMeta();
  if (!meta) {
    return {
      type: 'info',
      answer: lang === 'bn'
        ? 'প্রথমে একটি বই খুলুন, তারপর প্রশ্ন করুন।'
        : 'Open a book first, then ask a question about it.'
    };
  }

  // 1. Book search fallback (always available, clearly labelled)
  const searchResults = await searchInBook(question);
  let contextText = '';
  if (searchResults.length > 0) {
    contextText = searchResults.slice(0, 5).map(r => `Page ${r.page}: ${r.snippet}`).join('\n');
  } else {
    // Pull a few pages of text around current area
    try {
      contextText = await extractText(1, 5);
    } catch (_) {
      contextText = '';
    }
  }

  // 2. If local model is ready, try a simple grounded generation
  if (modelReady && pipeline) {
    try {
      const prompt = `Context from the textbook:\n${contextText.slice(0, 1500)}\n\nQuestion: ${question}\nAnswer briefly based only on the context:`;
      const out = await pipeline(prompt, {
        max_new_tokens: 120,
        temperature: 0.3,
        do_sample: false
      });
      const generated = Array.isArray(out) ? out[0]?.generated_text : out?.generated_text;
      // Strip the prompt if echoed
      let answer = (generated || '').replace(prompt, '').trim();
      if (answer.length > 20) {
        return {
          type: 'generate',
          answer,
          references: searchResults.slice(0, 3).map(r => ({ page: r.page, snippet: r.snippet })),
          source: 'local-model'
        };
      }
    } catch (err) {
      console.warn('Generation failed, falling back to search:', err);
    }
  }

  // 3. Honest search-based answer
  if (searchResults.length > 0) {
    const lines = searchResults.slice(0, 5).map(
      (r, i) => `${i + 1}. [Page ${r.page}] ${r.snippet}`
    );
    const header = lang === 'bn'
      ? '📚 বই-সার্চ ফলাফল (জেনারেটিভ AI নয়):'
      : '📚 Book-search results (not generative AI):';
    return {
      type: 'search',
      answer: `${header}\n\n${lines.join('\n\n')}`,
      references: searchResults.slice(0, 5),
      source: 'keyword-search'
    };
  }

  return {
    type: 'search',
    answer: lang === 'bn'
      ? 'এই বইয়ে আপনার প্রশ্নের সাথে মিলে যাওয়া কোনো অংশ পাওয়া যায়নি। অন্য কীওয়ার্ড চেষ্টা করুন বা অন্য পৃষ্ঠায় যান।'
      : 'No matching passages found in this book for your query. Try different keywords or open another section.',
    source: 'keyword-search'
  };
}

/**
 * Simple word explanation from extracted context
 */
export async function explainWord(word, lang = 'en') {
  if (!word) return null;
  const results = await searchInBook(word);
  if (results.length === 0) {
    return lang === 'bn'
      ? `"${word}" শব্দটি বর্তমান বইয়ে পাওয়া যায়নি।`
      : `"${word}" was not found in the current book.`;
  }
  return results.slice(0, 3).map(r => `[Page ${r.page}] ${r.snippet}`).join('\n');
}
