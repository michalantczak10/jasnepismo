let lastUsage = null;

function getOpenAIApiKey() {
  return process.env.OPENAI_API_KEY;
}
function getOpenAIModel() {
  return process.env.OPENAI_MODEL || 'gpt-5-mini';
}

async function callOpenAI(body) {
  const OPENAI_API_KEY = getOpenAIApiKey();
  if (!OPENAI_API_KEY) throw new Error('Brak klucza OpenAI API na serwerze.');
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok) {
    const errMsg = data?.error?.message || data?.message || `Błąd połączenia z OpenAI: ${resp.status}`;
    const err = new Error(errMsg);
    // Detect organization verification error message and tag it so caller can respond appropriately
    if (errMsg && errMsg.toLowerCase().includes('must be verified')) {
      err.code = 'ORG_UNVERIFIED';
    }
    err.status = resp.status;
    throw err;
  }
  return data;
}

async function generateExplanation(text) {
  if (!text || !text.trim()) throw new Error('Brak treści do przetworzenia.');
  const OPENAI_MODEL = getOpenAIModel();
  const FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || '';

  const makeReq = (model) => ({
    model,
    messages: [
      { role: 'system', content: 'Jesteś asystentem, który tłumaczy pisma urzędowe na prosty język.' },
      { role: 'user', content: text.trim() },
    ],
    temperature: 0.2,
    max_tokens: 600,
  });

  // Try primary model first
  try {
    const data = await callOpenAI(makeReq(OPENAI_MODEL));
    const explanation = data.choices?.[0]?.message?.content?.trim();
    lastUsage = data.usage || null;
    return { explanation, usage: lastUsage };
  } catch (err) {
    // If organization/permission error and fallback configured, try fallback
    const isOrgUnverified = err && (err.code === 'ORG_UNVERIFIED' || (err.message && err.message.toLowerCase().includes('must be verified')) || err.status === 403);
    if (isOrgUnverified && FALLBACK_MODEL && FALLBACK_MODEL !== OPENAI_MODEL) {
      try {
        const data2 = await callOpenAI(makeReq(FALLBACK_MODEL));
        const explanation = data2.choices?.[0]?.message?.content?.trim();
        lastUsage = data2.usage || null;
        return { explanation, usage: lastUsage };
      } catch (err2) {
        // If fallback also fails, throw original error (for clearer messaging)
        err2.original = err;
        throw err2;
      }
    }
    throw err;
  }
}

function getLastUsage() { return lastUsage; }
function getCacheStats() { return { hits: 0, misses: 0, size: 0, max_entries: 0, ttl_ms: 0 }; }

module.exports = { generateExplanation, getLastUsage, getCacheStats };
