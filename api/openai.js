let lastUsage = null;
const featureFlags = require('../lib/feature-flags');

function getOpenAIApiKey() {
  return process.env.OPENAI_API_KEY;
}

function getOpenAIModel() {
  return process.env.OPENAI_MODEL || 'gpt-4.1-mini';
}

async function generateExplanation(text) {
  if (!featureFlags.isEnabled('openai')) {
    throw new Error('Funkcja integracji z OpenAI została wyłączona na tym serwerze.');
  }

  const OPENAI_API_KEY = getOpenAIApiKey();
  const OPENAI_MODEL = getOpenAIModel();

  if (!OPENAI_API_KEY) {
    throw new Error('Brak klucza OpenAI API na serwerze.');
  }

  const prompt = `Wyjaśnij poniższe pismo urzędowe prostym, zrozumiałym językiem dla osoby bez przygotowania prawniczego. Podkreśl najważniejsze informacje i napisz, jakie mogą być następne kroki. Treść pisma:
"""
${text.trim()}
"""`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'Jesteś asystentem, który tłumaczy pisma urzędowe na prosty język.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 900
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Błąd połączenia z OpenAI.');
  }

  const explanation = data.choices?.[0]?.message?.content?.trim();
  if (!explanation) {
    throw new Error('Model nie zwrócił wyjaśnienia.');
  }

  lastUsage = data.usage || null;
  return { explanation, usage: lastUsage };
}

function getLastUsage() {
  return lastUsage;
}

module.exports = {
  generateExplanation,
  getLastUsage
};
