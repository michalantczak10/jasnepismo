# Jasne pismo — wyjaśniamy pisma z urzędu prostym językiem

Wklej tekst urzędowego pisma lub wyślij plik (PDF, JPG, DOCX). Kliknij „Wyjaśnij”. Dostaniesz odpowiedź napisaną prostym językiem.

## Jak działa

- **Tekst** — wklej treść pisma w pole tekstowe (maks. 5000 znaków).
- **Pliki** — wyślij jeden lub kilka plików. Obsługiwane formaty: PDF, DOC, DOCX, ODT, RTF, TXT, JPG, PNG, BMP, GIF.
- **Kilka plików naraz** — pliki są sortowane alfabetycznie po nazwie i łączone w jeden tekst przed wysłaniem do AI.
- **Ograniczenia** — maks. 10 plików, każdy do 5 MB. Zdjęcia i skany są czytane przez OCR (jakość zależy od czytelności).
- **Wyjaśnienie** — tekst trafia do OpenAI (domyślnie `gpt-4o-mini`). Odpowiedź to informacja, nie porada prawna.

## Uruchomienie lokalne

```bash
# zainstaluj zależności
npm install

# skopiuj i uzupełnij zmienne środowiskowe
cp .env.example .env
# edytuj .env — ustaw OPENAI_API_KEY

# uruchom serwer deweloperski (HTTP na porcie 3000)
npm start

# uruchom z HTTPS (wymagane dla Service Workera)
npm run start:https
```

## Zmienne środowiskowe

| Zmienna | Domyślnie | Opis |
|---|---|---|
| `OPENAI_API_KEY` | — | Klucz API OpenAI (wymagany) |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model do generowania wyjaśnień |
| `OPENAI_FALLBACK_MODEL` | `gpt-4o-mini` | Model fallback |
| `OCR_CONCURRENCY` | `1` | Maks. równoczesnych zadań OCR |
| `OCR_TIMEOUT_MS` | `20000` | Limit czasu OCR (ms) |
| `OCR_WORKER_URL` | — | URL zewnętrznego workera OCR (opcjonalny) |

## Testy

```bash
# wszystkie testy E2E (mockowane + real API)
npx playwright test

# tylko testy jednostkowe
node tests/unit/*.js

# testy E2E bez prawdziwego API (pomija testy wymagające OPENAI_API_KEY)
npx playwright test --grep-invert "REAL"

# wygeneruj próbki plików
node e2e/tmp/gen-samples.js
node e2e/tmp/gen-multi.js
```

## Architektura

- **Frontend** — statyczny HTML/CSS/JS (brak frameworka). Service Worker do offline. Dark mode.
- **Backend** — serwer Node.js (Express-less, własny router). Endpoint `POST /api/explain`.
- **Ekstrakcja plików** — `pdf-parse` (PDF), `mammoth` (DOCX), `adm-zip` + `xml2js` (ODT), heurystyczna (RTF/DOC), `tesseract.js` (obrazy).
- **AI** — OpenAI API z fallback modelem i wykrywaniem błędów (quota, org_unverified, timeout).
- **Rate limiting** — 10 req/60s na IP (w pamięci lub Redis). Wyłączone w testach.

## Licencja

Projekt prywatny. Kod źródłowy udostępniony do wglądu.
