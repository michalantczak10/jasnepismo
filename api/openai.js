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
  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    const errMsg = (data && (data.error?.message || data.message)) || `Błąd połączenia z OpenAI: ${resp.status}`;
    const err = new Error(errMsg);
    // Detect organization verification / permission error message and tag it so caller can respond appropriately
    const msg = (errMsg || '').toString().toLowerCase();
    let isOrgUnverified = false;
    // Heuristics to catch English and Polish variants of the org verification problem
    if (
      msg.includes('must be verified') ||
      msg.includes('not verified') ||
      msg.includes('unverified') ||
      msg.includes('nie jest zweryfik') ||
      msg.includes('zweryfik') ||
      (msg.includes('organization') && (msg.includes('verify') || msg.includes('verified') || msg.includes('unverified')))
    ) {
      isOrgUnverified = true;
    } else if (resp.status === 403 || resp.status === 401) {
      // 403/401 often indicate permission/organization restrictions
      isOrgUnverified = msg.includes('organization') || msg.includes('org') || msg.includes('verified') || msg.includes('unverified') || msg.includes('must be verified') || msg.includes('not verified');
    }
    if (isOrgUnverified) err.code = 'ORG_UNVERIFIED';
    err.status = resp.status;
    throw err;
  }
  return data;
}

async function generateExplanation(text) {
  if (!text || !text.trim()) throw new Error('Brak treści do przetworzenia.');
  const OPENAI_MODEL = getOpenAIModel();
  const FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || 'gpt-3.5-turbo';

  const makeReq = (model) => ({
    model,
    messages: [
      {
        role: 'system',
        content:
          "Jesteś asystentem prawnym, który w przystępny sposób wyjaśnia treść pism urzędowych po polsku. Nie powtarzaj oryginalnego tekstu 1:1. W odpowiedzi podaj:\n\n1) Krótkie streszczenie (1-3 zdania).\n2) Najważniejsze punkty dokumentu (lista punktowana).\n3) Konkretne zalecane kroki lub działania (krótka lista).\n\nJeżeli brakuje istotnych informacji, wskaż które fragmenty wymagają doprecyzowania. Odpowiadaj zwięźle, używaj prostego języka i list punktowanych tam, gdzie to pomaga. Nie cytuj długich fragmentów dokumentu, zamiast tego streszczaj."
      },
      { role: 'user', content: `Oto tekst do wyjaśnienia:\n\n${text.trim()}\n\nProszę przygotować wyjaśnienie według powyższych zasad.` },
    ],
    temperature: 0.2,
    max_tokens: 800,
  });

  // Try primary model first
  try {
    const data = await callOpenAI(makeReq(OPENAI_MODEL));
    const explanation = data.choices?.[0]?.message?.content?.trim();
    lastUsage = data.usage || null;
    return { explanation, usage: lastUsage, model: OPENAI_MODEL };
  } catch (err) {
    // Detect organization/permission issues (English + Polish heuristics)
    const msg = (err && err.message) ? err.message.toString().toLowerCase() : '';
    const isOrgUnverified = err && (err.code === 'ORG_UNVERIFIED' || err.status === 403 || msg.includes('must be verified') || msg.includes('not verified') || msg.includes('unverified') || msg.includes('zweryfik'));

    if (isOrgUnverified && FALLBACK_MODEL && FALLBACK_MODEL !== OPENAI_MODEL) {
      try {
        console.warn(`OpenAI model "${OPENAI_MODEL}" failed with organization/permission error; retrying with fallback "${FALLBACK_MODEL}".`);
        const data2 = await callOpenAI(makeReq(FALLBACK_MODEL));
        const explanation = data2.choices?.[0]?.message?.content?.trim();
        lastUsage = data2.usage || null;
        return { explanation, usage: lastUsage, model: FALLBACK_MODEL, fallback: true };
      } catch (err2) {
        // Preserve original error for diagnostics
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
