# Jasne pismo — wyjaśnianie pism urzędowych

Prosta aplikacja webowa do wyjaśniania pism urzędowych z wykorzystaniem modeli OpenAI.

Opis działania (aktualny stan)

- Wejście: użytkownik może wkleić tekst lub przesłać plik (formularz multipart/form-data).
- Priorytet: zawartość pola tekstowego (documentText) jest zawsze używana, jeśli nie jest pusta. Jeśli pole jest puste i przesłano plik, backend spróbuje wyodrębnić tekst z pliku.
- Ekstrakcja plików wykonywana jest po stronie serwera (z obsługą obrazów OCR lokalnie).

Obsługiwane typy plików i użyte biblioteki

- PDF — pdf-parse (serwerowo)
- DOCX — mammoth (serwerowo)
- ODT — adm-zip + xml2js (czytanie content.xml)
- DOC / RTF — heurystyczne przetwarzanie RTF -> tekst (best-effort)
- TXT / text/\* — odczyt UTF-8
- Obrazy (jpg, jpeg, png, bmp) — OCR przez tesseract.js; obraz normalizowany przez sharp (konwersja do PNG) przed rozpoznaniem

Uwaga o OCR lokalnym

- OCR opiera się na tesseract.js. Pliki językowe (pol.traineddata, eng.traineddata) znajdują się w katalogu głównym repozytorium.
- OCR jest kosztowne obliczeniowo — rozważ cache lub asynchroniczne przetwarzanie dla większych wolumenów.

Główne endpointy API (aktualne)

- POST /api/explain
  - Przyjmuje JSON: `{ "text": "..." }` lub multipart/form-data z polem `file` i opcjonalnym polem `text`.
  - Jeśli nagłówek `X-Extract-Only: 1` jest obecny, endpoint zwraca `{ "extractedText": "..." }` i nie wywołuje OpenAI.
  - Odpowiedź normalna: `{ "explanation": "...", "usage": {...}, "usedModel": "...", "usedFallback": true|false }`.
  - Ograniczenia: rate-limit (10 żądań/min na klienta, in-memory — per instancja serverless, nie globalnie), maks. długość tekstu 5000 znaków (413 jeśli przekroczone).

- GET /api/health
  - Zwraca podstawowy stan aplikacji: `status`, `timestamp`, `uptime_seconds`, `model`.

- GET /api/usage
  - Zwraca `last_usage` z ostatniego wywołania `/api/explain` (in-memory, per instancja serverless).

Konfiguracja środowiska (ważne zmienne)

- `OPENAI_API_KEY` (wymagane) — klucz API OpenAI używany przez `/api/explain`.
- `OPENAI_MODEL` (opcjonalne) — preferowany model.
- `OPENAI_FALLBACK_MODEL` (opcjonalne) — model zapasowy w przypadku ograniczeń organizacyjnych.
- `OPENAI_REQUEST_TIMEOUT_MS` (opcjonalne) — maksymalny czas oczekiwania na odpowiedź OpenAI w milisekundach. Domyślnie `20000`.

Dodatkowe zmienne konfiguracji (rate limiter / OCR / Redis)

- `UPSTASH_REDIS_REST_URL` i `UPSTASH_REDIS_REST_TOKEN` — opcjonalne, używane do serverless-friendly rate limiting (Upstash). Jeśli je ustawisz, aplikacja użyje Upstash dla limitów.
- `REDIS_URL` — opcjonalne, jeśli posiadasz prywatny Redis preferowany zamiast Upstash. Format: `redis://:password@host:port` lub `rediss://`.
- `OCR_CONCURRENCY` — maksymalna liczba równoległych OCR jobów na jedną instancję (domyślnie `1`).
- `OCR_TIMEOUT_MS` — timeout OCR w milisekundach (domyślnie `20000`).
- `OCR_WORKER_TIMEOUT_MS` — timeout fetch do zewnętrznego OCR worker (domyślnie `20000`).

Vercel — szybkiek kroki:

1. W panelu projektu -> Settings -> Environment Variables dodaj wymienione zmienne.
2. Jeśli korzystasz z Upstash, dodaj `UPSTASH_REDIS_REST_URL` i `UPSTASH_REDIS_REST_TOKEN`.
3. Jeśli korzystasz z prywatnego Redis, ustaw `REDIS_URL` i opcjonalnie usuń Upstash.

Monitoring i health-check

- Endpoint: `GET /api/health` zwraca teraz metryki per-instance (uptime, memory i podstawowe liczniki: OCR jobs, rate limit hits, etc.).
- Prosty GitHub Action `health-check` jest dodany (`.github/workflows/health-check.yml`) i może być uruchomiony co 5 minut. Dodaj repo secret `HEALTHCHECK_URL` ustawiony na `https://<your-deploy>/api/health`.

Rekomendacje produkcyjne

- Na Vercel nie zalecamy wykonywać ciężkiego OCR bezpośrednio w funkcji serverless; rozważ oddzielny worker z kolejką (np. Cloud Run/Bunq/BullMQ) dla produkcji.
- Ustaw `OCR_CONCURRENCY=1` jeżeli zostajesz przy serverless OCR. Przenieś do workerów aby skalować.
- Dodaj globalny Redis (Upstash lub prywatny Redis) do obsługi rate-limiting, by chronić się przed obejściem limitów w środowiskach wieloinstancyjnych.

OCR queue (worker)

Jeżeli chcesz przenieść OCR do workerów, projekt zawiera prosty przykład:

- POST /api/ocr-queue — dodaje plik do kolejki (multipart/form-data), odpowiada { jobId, id }
- GET /api/ocr-result?id=<id> — sprawdza wynik (pending | done)

Uruchomienie worker-a lokalnie:

1. Ustaw REDIS_URL w środowisku.
2. Zainstaluj opcjonalne dependencies (`npm ci --omit=dev` lub `npm i bullmq ioredis`).
3. Uruchom worker: `node worker/ocr-worker.js`.

Worker zapisuje wynik do Redis pod kluczem `ocr:result:<id>` z TTL 1h.

Docker / Deployment dla worker-a

1. Lokalnie przy użyciu docker-compose:
   - W katalogu głównym: `docker compose -f worker/docker-compose.yml up --build`
   - Worker uruchomi Redis i worker, ustawiony jest REDIS_URL na `redis://redis:6379`.

2. Docker image (produkcyjnie):
   - Zbuduj obraz: `docker build -t jasnepismo-worker -f worker/Dockerfile .`
   - Uruchom: `docker run -e REDIS_URL=redis://... jasnepismo-worker`

3. Systemd (VM):
   - Skopiuj `deploy/worker-systemd.service` na serwer i uzupełnij `REDIS_URL`.
   - Przykładowe komendy:
     - `sudo cp deploy/worker-systemd.service /etc/systemd/system/jasnepismo-worker.service`
     - `sudo systemctl daemon-reload`
     - `sudo systemctl enable --now jasnepismo-worker`



Opcjonalne/zaawansowane ustawienia

1. Zewnętrzny serwis OCR (forwarding)

- Zmienna: `OCR_WORKER_URL` — pełny URL worker'a (np. `https://ocr.example/process`).
- W kodzie: w `api/explain.js` należy mieć blok, który po nieudanej ekstrakcji wywołuje worker:

```js
if ((!text || !String(text).trim()) && process.env.OCR_WORKER_URL) {
  const OCR_URL = String(process.env.OCR_WORKER_URL).replace(/\/+$/, '') + '/process';
  // zbuduj FormData (global.FormData lub require('form-data'))
  // dołącz plik (strumień z filepath lub buffer) pod kluczem 'file'
  // wyślij fetch(OCR_URL, { method: 'POST', headers, body: formBody })
  // jeśli odpowiedź zawiera text/result.text ustaw text = otrzymany tekst
}
```

2. Endpoint administracyjny kosztów (opcjonalny)

- Aby dodać `GET /api/costs` umieść w `api/costs.js` handler, który:
  - weryfikuje nagłówek `x-admin-token` lub `Authorization: Bearer <token>` i porównuje z `process.env.ADMIN_API_TOKEN`;
  - używa `process.env.OPENAI_ADMIN_KEY` (lub `OPENAI_API_KEY`) do wywołania OpenAI organization costs i zwraca wynik.

Przykładowy szkic pliku `api/costs.js`:

```js
module.exports = async function handler(req, res) {
  if ((req.method || 'GET').toUpperCase() !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj GET.' });
  }
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken)
    return res
      .status(501)
      .json({ error: 'Endpoint nie jest skonfigurowany. Brakuje ADMIN_API_TOKEN.' });
  // sprawdź nagłówek, pobierz OPENAI_ADMIN_KEY itd., wywołaj fetch do OpenAI i zwróć JSON
};
```

3. Oddzielny endpoint ekstrakcji (opcjonalny)

- Możesz dodać `api/extract.js` z prostym handlerem:

```js
const { parseForm, extractTextFromFile } = require('./extract-utils');
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj POST.' });
  }
  const parsed = await parseForm(req);
  const files = parsed.files || {};
  const file = files.documentFile || files.file || Object.values(files)[0];
  if (!file) return res.status(400).json({ error: 'Brak pliku w żądaniu.' });
  const text = await extractTextFromFile(file);
  return res.status(200).json({ extractedText: text || '' });
};
```

Testy i uruchomienie lokalne

- Wymagania: Node.js >= 24
- Instalacja: `npm ci`
- Wszystkie testy: `npm test` (Node test runner)
- Unit tests: `npm run test:unit`
- E2E (Playwright): `npm run test:e2e` (upewnij się, że uruchomiłeś `npx playwright install --with-deps chromium` raz)
- Lint: `npm run lint`

Pliki i lokalizacje istotne dla dewelopera

- `api/explain.js` — główny handler (ekstrakcja + wywołanie OpenAI)
- `api/extract-utils.js` — logika ekstrakcji plików (pdf-parse, mammoth, adm-zip+xml2js, tesseract.js)
- `api/usage.js` — zwraca ostatnie użycie tokenów
- `api/health.js` — endpoint zdrowia
- `tests/unit/` — testy jednostkowe (Node test runner)
- `tests/e2e/` — testy Playwright E2E
- `scripts/app.js` — frontend event handling (input pliku, wysyłka)

Wskazówki operacyjne

- Jeśli przywracasz OCR lokalny w środowisku CI/produkcyjnym, upewnij się, że runner ma wystarczające zasoby i że językowe traineddata są dostępne.
- Przy większym ruchu rozważ wyodrębnianie OCR do osobnego asynchronicznego procesu/queue.
