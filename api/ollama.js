const fetch = global.fetch || require('node-fetch');

function getOllamaUrl() {
  return String(process.env.OLLAMA_URL || '').replace(/\/$/, '');
}
function getOllamaModel() {
  return process.env.OLLAMA_MODEL || 'llama2';
}

async function callOllama(prompt) {
  const url = getOllamaUrl();
  if (!url) throw new Error('OLLAMA_URL nie jest ustawione.');

  const body = {
    model: getOllamaModel(),
    prompt,
    max_tokens: 600,
    temperature: 0.2,
    stream: false
  };

  const res = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    // note: node-fetch ignores timeout in options for v2; environment should handle function timeouts
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && (data.error || data.message)) || `Ollama returned ${res.status}`);
  }

  // Try to extract text from several possible response shapes
  let text = '';
  if (data) {
    if (typeof data === 'string') text = data;
    else if (data.choices && data.choices[0] && typeof data.choices[0].text === 'string') text = data.choices[0].text;
    else if (data.output && Array.isArray(data.output) && data.output[0]) {
      // Ollama may return { output: [{ content: [{ type: 'output_text', text: '...' }, ...] }] }
      const out0 = data.output[0];
      if (out0.content) {
        // find text parts
        for (const c of out0.content) {
          if (c.type === 'output_text' && c.text) {
            text += c.text + '\n';
          } else if (c.text) {
            text += c.text + '\n';
          }
        }
      } else if (typeof out0 === 'string') {
        text = out0;
      }
    } else if (data.text) text = data.text;
    else if (data.generated && Array.isArray(data.generated) && data.generated[0] && data.generated[0].text) text = data.generated[0].text;
  }

  return (text || '').trim();
}

async function generateExplanation(inputText) {
  if (!inputText || !inputText.trim()) throw new Error('Brak treści do przetworzenia.');

  // Match the system/user structure used for OpenAI for consistency
  const system = 'Jesteś asystentem, który tłumaczy pisma urzędowe na prosty język.';
  const prompt = `${system}\n\nUżytkownik: ${inputText.trim()}`;

  const explanation = await callOllama(prompt);

  // Ollama doesn't provide usage out of the box in the same shape as OpenAI; return null for usage
  return { explanation, usage: null };
}

module.exports = { generateExplanation };