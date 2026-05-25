const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generateExplanation(text) {
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
      model: 'gpt-4.1-mini',
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

  return explanation;
}

module.exports = {
  generateExplanation
};
