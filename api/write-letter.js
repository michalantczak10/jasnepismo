const { checkRateLimit } = require("./rate-limit");
const openai = require("./openai");

const MAX_DESC_LENGTH = 5000;

function getPrompt() {
  return {
    system:
      "Jesteś asystentem, który pomaga pisać oficjalne pisma po polsku. Na podstawie opisu sytuacji podanego przez użytkownika napisz kompletne, formalne pismo.\n\n" +
      "Pismo powinno zawierać:\n" +
      "- Miejscowość i datę\n" +
      "- Nagłówek (określający rodzaj pisma)\n" +
      "- Treść napisaną formalnym, ale zrozumiałym językiem\n" +
      "- Podpis\n\n" +
      "Dostosuj styl i format do rodzaju pisma (podanie, skarga, reklamacja, wniosek, zapytanie, odwołanie itp.) — rozpoznaj rodzaj na podstawie opisu.\n\n" +
      "Używaj prostego języka, unikaj kancelaryjnego żargonu. Pismo ma być zrozumiałe dla zwykłego człowieka, ale zachować formalną strukturę.\n\n" +
      "Nie dodawaj komentarzy ani wyjaśnień — napisz tylko treść pisma.",
    temperature: 0.3,
    max_tokens: 1200,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Metoda nie dozwolona." }));
    return;
  }

  const clientKey =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const allowed = await checkRateLimit(clientKey);
  if (!allowed) {
    res.writeHead(429, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Zbyt wiele żądań. Spróbuj za chwilę." }));
    return;
  }

  let body = "";
  try {
    for await (const chunk of req) body += chunk;
    const parsed = JSON.parse(body);
    const description = (parsed.description || "").trim();

    if (!description) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Opis nie może być pusty." }));
      return;
    }

    if (description.length > MAX_DESC_LENGTH) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: `Opis za długi. Maksymalnie ${MAX_DESC_LENGTH} znaków.`,
        }),
      );
      return;
    }

    const prompt = getPrompt();

    const result = await openai.callOpenAI({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt.system },
        {
          role: "user",
          content: `Opis sytuacji:\n\n${description}\n\nPrzygotuj pismo według powyższych zasad.`,
        },
      ],
      temperature: prompt.temperature,
      max_tokens: prompt.max_tokens,
    });

    const letter = result.choices?.[0]?.message?.content?.trim() || "";
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        letter,
        usage: result.usage || null,
        usedModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
      }),
    );
  } catch (err) {
    const msg = err && err.message ? err.message.toString() : "";
    console.error("write-letter error:", err);

    if (err && err.code === "ORG_UNVERIFIED") {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ error: "Konto OpenAI nie jest zweryfikowane." }),
      );
      return;
    }

    if (
      msg.includes("rate limit") ||
      msg.includes("Too Many Requests") ||
      msg.includes("429")
    ) {
      res.writeHead(429, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Przekroczono limit zapytań do OpenAI. Spróbuj za chwilę.",
        }),
      );
      return;
    }

    if (
      msg.includes("invalid_api_key") ||
      msg.includes("invalid API key") ||
      msg.includes("Incorrect API key")
    ) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Nieprawidłowy klucz API OpenAI." }));
      return;
    }

    if (msg.includes("Insufficient Quota") || msg.includes("quota")) {
      res.writeHead(402, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error:
            "Przekroczono limit wykorzystania OpenAI. Sprawdź swoje konto.",
        }),
      );
      return;
    }

    if (msg.includes("Request too large") || msg.includes("too many tokens")) {
      res.writeHead(413, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Opis jest za długi. Skróć go i spróbuj ponownie.",
        }),
      );
      return;
    }

    if (err && err.code === "OPENAI_TIMEOUT") {
      res.writeHead(504, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Serwer AI nie odpowiedział na czas. Spróbuj ponownie.",
        }),
      );
      return;
    }

    if (
      msg.includes("model_not_found") ||
      msg.includes("does not exist") ||
      msg.includes("not found")
    ) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Wybrany model AI nie jest dostępny." }));
      return;
    }

    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ error: "Błąd serwera. Spróbuj ponownie później." }),
    );
  }
};
