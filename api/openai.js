let lastUsage = null;
const crypto = require('crypto');

// Simple in-memory LRU cache
const CACHE_MAX_ENTRIES = process.env.CACHE_MAX_ENTRIES
  ? Number(process.env.CACHE_MAX_ENTRIES)
  : 200;
const CACHE_TTL_MS = process.env.CACHE_TTL_MS ? Number(process.env.CACHE_TTL_MS) : 60 * 60 * 1000; // 1h
const cacheMap = new Map(); // key -> { value, ts }
let cacheHits = 0;
let cacheMisses = 0;

function cacheGet(key) {
  const entry = cacheMap.get(key);
  if (!entry) {
    cacheMisses += 1;
    console.info('[cache] miss', { key });
    return null;
  }
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cacheMap.delete(key);
    cacheMisses += 1;
    console.info('[cache] expired', { key });
    return null;
  }
  // refresh order
  cacheMap.delete(key);
  cacheMap.set(key, entry);
  cacheHits += 1;
  console.info('[cache] hit', { key });
  return entry.value;
}

function cacheSet(key, value) {
  cacheMap.set(key, { value, ts: Date.now() });
  console.info('[cache] set', { key, size: cacheMap.size });
  while (cacheMap.size > CACHE_MAX_ENTRIES) {
    const oldestKey = cacheMap.keys().next().value;
    cacheMap.delete(oldestKey);
    console.info('[cache] evict', { evicted: oldestKey });
  }
}

function getCacheStats() {
  return {
    hits: cacheHits,
    misses: cacheMisses,
    size: cacheMap.size,
    max_entries: CACHE_MAX_ENTRIES,
    ttl_ms: CACHE_TTL_MS,
  };
}

function getOpenAIApiKey() {
  return process.env.OPENAI_API_KEY;
}

function getOpenAIModel() {
  // Default to gpt-5-mini (available in your environment)
  return process.env.OPENAI_MODEL || 'gpt-5-mini';
}

async function callOpenAI(body) {
  const OPENAI_API_KEY = getOpenAIApiKey();
  if (!OPENAI_API_KEY) throw new Error('Brak klucza OpenAI API na serwerze.');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error?.message || 'Błąd połączenia z OpenAI.');
  }
  return data;
}

async function compressText(input, maxChars = 1000) {
  if (!input) return '';
  const stopwords = new Set([
    'i',
    'w',
    'na',
    'do',
    'ze',
    'z',
    'się',
    'oraz',
    'ale',
    'że',
    'to',
    'jest',
    'jak',
    'o',
    'po',
    'dla',
    'przez',
    'u',
    'od',
    'czy',
    'się',
    'się',
    'si',
    'nie',
    'tak',
    'ale',
  ]);
  // Split into sentences (simple regex)
  const sentences = input
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.join(' ').length <= maxChars) return sentences.join(' ');

  // Score sentences by number of content words
  const scored = sentences.map((s, idx) => {
    const words = s.split(/[^\p{L}0-9]+/u).filter(Boolean);
    let score = 0;
    for (const w of words) {
      const lw = w.toLowerCase();
      if (lw.length <= 2) continue;
      if (!stopwords.has(lw)) score += 1;
    }
    return { idx, s, score, len: s.length };
  });

  // Select top sentences until maxChars
  scored.sort((a, b) => b.score - a.score || a.len - b.len);
  const selected = [];
  let total = 0;
  for (const item of scored) {
    if (total + item.len + 1 > maxChars) continue;
    selected.push(item);
    total += item.len + 1;
    if (total >= maxChars) break;
  }
  // Restore original order
  selected.sort((a, b) => a.idx - b.idx);
  return selected.map((it) => it.s).join(' ');
}

async function generateExplanation(text) {
  const OPENAI_MODEL = getOpenAIModel();
  if (!text || !text.trim()) throw new Error('Brak treści do przetworzenia.');

  // Compress input locally to reduce tokens sent to the model
  const compressed = await compressText(
    text.trim(),
    process.env.PROMPT_MAX_CHARS ? Number(process.env.PROMPT_MAX_CHARS) : 1000
  );

  // Try cache first (keyed by compressed text)
  const key = crypto.createHash('sha256').update(compressed).digest('hex');
  const cached = cacheGet(key);
  if (cached) return cached;

  // Stage 1: concise extraction of key facts (short, low token usage)
  const extractPrompt = `Wyodrębnij kluczowe informacje z poniższego pisma w maksymalnie 60 słowach. Podaj krótkie streszczenie (1-2 zdania) oraz listę 3 najważniejszych punktów w formie punktów. Dokument:\n"""\n${compressed}\n"""`;

  const extractReq = {
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'system',
        content: 'Jesteś narzędziem do ekstrakcji kluczowych faktów z dokumentów.',
      },
      { role: 'user', content: extractPrompt },
    ],
    temperature: 0.0,
    max_tokens: 150,
  };

  const extractData = await callOpenAI(extractReq);
  const extractText = extractData.choices?.[0]?.message?.content?.trim() || '';

  // Stage 2: generate user-facing explanation based on concise extract
  const explainPrompt = `Masz krótkie streszczenie i kluczowe punkty dokumentu:\n${extractText}\n\nNa tej podstawie wygeneruj krótkie, jasne wyjaśnienie przeznaczone dla osoby bez przygotowania prawniczego. Podziel odpowiedź na: 1) Krótkie streszczenie (maks. 2-3 zdania), 2) Co to oznacza dla mnie (punkty), 3) Możliwe następne kroki (3 kroki). Bądź zwięzły i praktyczny.`;

  const explainReq = {
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'system',
        content: 'Jesteś asystentem, który tłumaczy pisma urzędowe na prosty język.',
      },
      { role: 'user', content: explainPrompt },
    ],
    temperature: 0.2,
    max_tokens: 600,
  };

  const explainData = await callOpenAI(explainReq);
  const explanation = explainData.choices?.[0]?.message?.content?.trim();
  if (!explanation) throw new Error('Model nie zwrócił wyjaśnienia.');

  // Aggregate usage: sum of both calls if available
  const usage1 = extractData.usage || null;
  const usage2 = explainData.usage || null;
  lastUsage = null;
  if (usage1 && usage2) {
    lastUsage = {
      prompt_tokens: (usage1.prompt_tokens || 0) + (usage2.prompt_tokens || 0),
      completion_tokens: (usage1.completion_tokens || 0) + (usage2.completion_tokens || 0),
      total_tokens: (usage1.total_tokens || 0) + (usage2.total_tokens || 0),
    };
  } else if (usage2) {
    lastUsage = usage2;
  } else if (usage1) {
    lastUsage = usage1;
  }

  const result = { explanation, usage: lastUsage };
  // Store in cache for future requests
  try {
    cacheSet(key, result);
  } catch (e) {
    /* ignore cache errors */
  }
  return result;
}

function getLastUsage() {
  return lastUsage;
}

module.exports = {
  generateExplanation,
  getLastUsage,
  getCacheStats,
};
