# Jasne pismo — wyjaśnianie pism urzędowych

Prosta aplikacja webowa do wyjaśniania pism urzędowych z wykorzystaniem AI. Umożliwia wklejenie tekstu lub przesłanie skanu/dokumentu i wygenerowanie prostego wyjaśnienia (treść jest wysyłana do OpenAI wyłącznie w celu wygenerowania odpowiedzi).

## Co znajduje się w projekcie

- `index.html` — strona główna
- `styles.css` — styl wizytówki
- `img/` — obrazy używane na stronie
- `favicon.svg`, `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon-192x192.png`, `favicon-512x512.png` — ikony i favicona
- `apple-touch-icon.png`, `site.webmanifest`, `robots.txt`, `sitemap.xml` — pliki statyczne serwowane z katalogu głównego
- `.gitignore` — reguły Git

## Jak używać (szczegółowo)

1. Otwórz wdrożoną stronę (np. na Vercel) albo uruchom projekt lokalnie.
2. Wklej treść dokumentu w pole tekstowe u góry lub prześlij plik (obsługiwane: PDF, DOCX/DOC/DOTX, ODT, RTF, TXT, obrazy JPG/PNG/GIF).
3. Po wybraniu pliku aplikacja spróbuje automatycznie wczytać jego treść i wstawić ją do pola tekstowego:
   - Pliki tekstowe (.txt, .rtf, .md, .csv oraz mime typu text/*) są odczytywane w przeglądarce i natychmiast wstawiane do pola tekstowego.
   - Dla PDF/DOCX/obrazów wysyłane jest żądanie wyodrębnienia (serwer albo zewnętrzny worker); po zakończeniu wynik jest wstawiany do pola tekstowego.
4. Zweryfikuj/edytuj treść w polu tekstowym (max 5000 znaków).
5. Kliknij przycisk "Wyjaśnij" — serwer użyje zawartości pola tekstowego (jeśli istnieje) lub pliku (jeśli nie ma tekstu) do wygenerowania wyjaśnienia.
6. Wynik pojawi się w sekcji wyników; dodatkowo backend zwróci statystyki zużycia tokenów oraz informację, którego modelu użyto (pola `usedModel` i `usedFallback`).

## Zasady i uwagi ważne dla działania

- Frontend zawsze priorytetowo używa zawartości pola tekstowego (documentText) do wysłania do `/api/explain`. Jeśli pole jest puste i przesłano plik, backend najpierw wyodrębni tekst z pliku i użyje go do wyjaśnienia.
- Klient korzysta z mechanizmu "extract-only" przy wczytywaniu pliku: wysyła plik do `/api/explain` z nagłówkiem `X-Extract-Only: 1` aby otrzymać tylko wyodrębniony tekst (pole `extractedText`).
- Limit długości tekstu wysyłanego do modelu to 5000 znaków (frontend pokazuje aktualną długość w elemencie textCount).
- Jeśli użyty model zwróci błąd związany z weryfikacją organizacji, serwer automatycznie spróbuje fallbacku (`OPENAI_FALLBACK_MODEL` lub `gpt-3.5-turbo`) i zwróci pole `usedFallback: true` w odpowiedzi.

## Referencja UI (elementy, testy, klasy)

Poniżej lista elementów DOM, ich id / data-testid oraz przeznaczenie — przydatne przy odtwarzaniu wyglądu i funkcjonalności:

- Pole główne: textarea
  - id: `documentText`
  - data-testid: `documentText`
  - Opis: tu wklejasz lub automatycznie wstawiana jest treść z pliku; maxlength wyświetlany w `textCount`.

- Licznik znaków:
  - id: `textCount`
  - data-testid: `textCount`
  - Wyświetla: "<aktualna> / 5000 znaków".

- Input pliku:
  - element: `<input type="file">`
  - id: `documentFile`
  - data-testid: `documentFile`
  - class: `file-upload-input`
  - Dodatkowy widoczny przycisk label: class `file-upload-button` (label for="documentFile").

- Szczegóły pliku (nazwa + rozmiar):
  - element: `<p>`
  - id: `fileDetails`
  - data-testid: `fileDetails`
  - class: `field-note file-details`
  - Hidden gdy brak pliku.

- Usuń plik:
  - `<button>` id: `removeFileButton`, data-testid: `removeFileButton`, class: `hero-cta hero-cta-secondary file-clear-button`
  - Domyślnie `disabled` — staje się aktywny po wczytaniu pliku.

- Wyczyść tekst:
  - `<button>` id: `clearButton`, data-testid: `clearButton`, class: `hero-cta hero-cta-secondary` — otwiera modal potwierdzenia.

- Modal potwierdzenia:
  - id: `confirmModal`, data-testid: `confirmModal` — zawiera `confirmClearButton` (potwierdza) i `cancelClearButton` (anuluje).

- Przycisk wyjaśnienia:
  - `<button>` id: `freeButton`, data-testid: `freeButton`, class: `hero-cta cta-warm` — uruchamia żądanie do `/api/explain`.

- Komunikaty statusu i błędów:
  - `statusMessage` — pokazywany podczas wysyłania/wczytywania pliku.
  - `errorMessage` — wyświetla komunikaty błędów po stronie klienta/serwera.

- Wynik:
  - `resultCard` — główny kontener karty z wynikiem.
  - `resultText` (data-testid `resultText`) — treść wygenerowanego wyjaśnienia.

- Style istotne przy odtworzeniu wyglądu:
  - `hero-cta`, `hero-cta-secondary`, `cta-warm` — przyciski akcji
  - `field-note` / `file-details` — drobne notatki i metadane pod polem.

## Mechanika po stronie klienta (scripts/app.js)

Plik: `scripts/app.js` — odpowiada za:
- Zapobieganie domyślnemu submitowi formularza.
- Obsługę zmiany inputu pliku: wstępne pokazanie nazwy pliku, odczyt treści pliku (lokalnie lub przez serwer), wstawienie treści do `documentText`, aktywacja przycisku "Usuń plik".
- Obsługę kliknięcia "Usuń plik" — czyści input i szczegóły pliku.
- Obsługę przycisku "Wyczyść" i modala potwierdzającego.
- Obsługę przycisku "Wyjaśnij" — wysyła zawartość pola (preferowane) lub pliku w formData do `/api/explain`, odbiera odpowiedź i wyświetla `explanation` w `resultText` oraz `usage` i dodatkowe pola `usedModel` / `usedFallback`.

Jeżeli chcesz przywrócić frontend w razie awarii, sprawdź czy plik `scripts/app.js` istnieje i czy w `index.html` znajduje się tag `<script defer src="scripts/app.js?v=...">`.

## Mechanika po stronie serwera (api/)

Główne endpointy:
- `POST /api/explain` — obsługuje dwa tryby:
  1. Normalny: przyjmuje `text` w JSON albo formData (`text` + optional `file`) i zwraca obiekt: `{ explanation, usage, usedModel, usedFallback }`.
  2. Extract-only: jeśli żądanie zawiera nagłówek `X-Extract-Only: 1` i przesłano plik, serwer zwraca `{ extractedText }` i nie wywołuje OpenAI.

- Ekstrakcja plików: wykonywana serwerowo przy użyciu bibliotek `pdf-parse` (PDF), `mammoth` (DOCX), `tesseract.js` (OCR obrazów) oraz prostego odczytu plików tekstowych. Aplikacja nie przekazuje plików do zewnętrznych serwisów OCR.

- OpenAI helper (`api/openai.js`): łączy się z OpenAI Chat Completions (endpoint `/v1/chat/completions`) i zapisuje statystyki użycia tokenów. Implementuje heurystykę wykrywania błędów weryfikacji organizacji i automatyczny fallback do `OPENAI_FALLBACK_MODEL` (domyślnie `gpt-3.5-turbo`).

- Ochrona i ograniczenia:
  - Rate limit per client: 10 żądań na minutę (in-memory fallback); endpoint zwraca 429 przy przekroczeniu.
  - Limit długości tekstu: 5000 znaków (413 Payload Too Large jeśli przekroczony).

## Zmienne środowiskowe (pełna lista)

- `OPENAI_API_KEY` (wymagane) — klucz API OpenAI.
- `OPENAI_MODEL` (opcjonalne) — preferowany model (np. `gpt-4.1-mini`, `gpt-4o`, `gpt-3.5-turbo`).
- `OPENAI_FALLBACK_MODEL` (opcjonalne, domyślnie `gpt-3.5-turbo`) — model do użycia gdy główny model zwraca błąd związany z weryfikacją organizacji.


## Przywracanie serwisu (krok po kroku)

1. Sklonuj repo: `git clone ... && cd jasnepismo`.
2. Zainstaluj zależności: `npm install`.
3. Sprawdź `index.html` ma poprawne id/data-testid (patrz sekcja Referencja UI).
4. Upewnij się, że `scripts/app.js` istnieje i zawiera obsługę eventów (jeśli brakuje, odtwórz z repoż historii Git — commit zawiera wersję, np. `git show <commit>:scripts/app.js`).
5. Uruchom testy jednostkowe: `npm test`.
6. Jeśli e2e są potrzebne: `npm run test:e2e` (upewnij się, że Playwright ma zainstalowane przeglądarki `npx playwright install --with-deps`).
7. Przy wdrożeniu na Vercel ustaw zmienne środowiskowe według listy powyżej i zdeployuj (Vercel automatycznie obsłuży pliki w `api/`).

## Testy i CI

- Testy jednostkowe: Node.js Test Runner (`node --test`) — pliki w `specs/`.
- Testy e2e: Playwright (`tests/e2e`) — skrypt `npm run test:e2e`.
- CI: `.github/workflows/ci.yml` — instaluje zależności, uruchamia `npm test`, instaluje Playwright browsers (`npx playwright install --with-deps`) i uruchamia e2e.

---

Jeżeli chcesz, mogę teraz:
- Zaktualizować frontend aby wyświetlał komunikat "Wyjaśnienie wygenerowane przy użyciu <model>" (pole `usedModel`),
- Dodać bardziej rozbudowany opis wizualny (kolory, fonty, spacing) — powiedz co dokładnie potrzeba.

## Uruchomienie z API

Ten projekt używa backendu Vercel Serverless do obsługi zapytań OpenAI.

### Endpointy API

- `GET /api/health`
  - Sprawdza, czy usługa działa.
  - Zwraca JSON z informacją o statusie, czasie działania i środowisku.
- `GET /api/usage`
  - Zwraca dane o ostatnim użyciu tokenów z wywołania `/api/explain`.
  - Pobiera dzienne dane kosztów OpenAI z endpointu organizacyjnego.
- `POST /api/explain`
  - Przyjmuje JSON z polem `text` i zwraca wyjaśnienie plus informacje o zużyciu tokenów.
  - Przyjmuje multipart/form-data z polem `file` i zwraca `{ extractedText }` — służy do wyodrębniania tekstu z plików (PDF, DOCX, TXT, obrazy przetworzone po stronie serwera/worker'a). Używaj tego endpointu, jeśli chcesz tylko pobrać tekst z pliku bez wywoływania OpenAI.


### Przykłady użycia

#### Sprawdzenie zdrowia usługi

```bash
curl -X GET https://jasnepismo.pl/api/health
```

#### Sprawdzenie użycia tokenów

```bash
curl -X GET https://jasnepismo.pl/api/usage
```

#### Wysłanie żądania do wyjaśnienia

```bash
curl -X POST https://jasnepismo.pl/api/explain \
  -H "Content-Type: application/json" \
  -d '{"text":"To jest testowy dokument do wyjaśnienia."}'
```

#### Sprawdzenie kosztów OpenAI

```bash
```

Możesz też użyć daty w query:

```bash
```

Ten endpoint używa OpenAI `/v1/organization/costs` i zwraca dzienne dane kosztów dla wybranego dnia.

Przykładowa odpowiedź z `/api/explain`:

```json
{
  "explanation": "...",
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 120,
    "total_tokens": 170
  }
}
```

## Wymagane zmienne środowiskowe

- `OPENAI_API_KEY` — klucz OpenAI wymagany do wywołań `/api/explain`.
- `OPENAI_MODEL` — opcjonalnie, model OpenAI do użycia. Domyślnie `gpt-4.1-mini`.
  - Przykłady: `gpt-4.1`, `gpt-4o`, `gpt-4.1-mini`.
  - Upewnij się, że dany model jest dostępny na twoim koncie OpenAI.

Uwaga: projekt zawiera teraz dodatkowe, chronione endpointy administracyjne:

- `GET /api/usage` — zwraca informacje o ostatnim użyciu tokenów (pole `last_usage`) z wywołania `/api/explain`.

Wymagane zmienne środowiskowe dla tych funkcji:

Zachowaj bezpieczeństwo: nie przechowuj tokenów i kluczy w repozytorium. Ustaw je w konfiguracji środowiska hostingu (Vercel, Cloud Run, itp.).

## Deployment on Vercel

1. Create a new project in Vercel and connect it to the `jasnepismo` repository.
2. Make sure `vercel.json` is present in the repo root.
3. Add the environment variable in Vercel:
   - `OPENAI_API_KEY`
4. Add the admin variables if you use protected endpoints:
5. Deploy the project. The site is served statically and backend routes are handled by Vercel Serverless Functions in the `api/` folder.

## Jak testować

1. Otwórz wdrożoną stronę na Vercel.
2. Wklej tekst pisma urzędowego i wybierz przycisk "Wyjaśnij".

### Zalecana wersja Node.js dla deweloperów

Projekt działa z Node.js >=24 (zdefiniowane w `package.json`). Rekomenduję używanie Node.js z rodziny 24.x (np. v24.14.0). Aby ułatwić zarządzanie wersją, dodałem plik `.nvmrc` z wartością `24`.

Przykładowe polecenia:

```powershell
# sprawdź aktualnie zainstalowaną wersję
node -v

# jeśli używasz nvm (UNIX/macOS)
nvm install 24; nvm use 24

# jeśli używasz nvm-windows (PowerShell)
# https://github.com/coreybutler/nvm-windows
nvm install 24.14.0; nvm use 24.14.0

# jeśli używasz Volta
volta install node@24
```

Jeśli chcesz, mogę przygotować plik `engines`/konfigurację dla Volta albo dodać instrukcje CI (np. w workflow GitHub Actions) żeby jawnie ustawić Node 24 w runnerach.

### Testy jednostkowe

Aby uruchomić testy lokalnie, wpisz:

```bash
npm test
```

Do repozytorium dodano także GitHub Actions, które uruchamiają testy przy pushu i pull requestach do `main`.

## Monitoring i zdrowie serwisu

Aby zewnętrzny serwis monitorujący przekonał się, że aplikacja działa, możesz podłączyć adres:

- `https://jasnepismo.pl/api/health`
- `https://jasnepismo.pl/api/usage`

Ten endpoint zwraca JSON z informacją:

- `status: ok`
- `timestamp`: aktualna data i godzina
- `uptime_seconds`: czas działania funkcji serwera
- `environment`: np. `vercel`
- `model`: używany model OpenAI

Dodatkowo:

- `POST /api/explain` zwraca pole `usage` wraz z wyjaśnieniem, co pozwala monitorować zużycie tokenów przy każdym żądaniu.
- `GET /api/usage` zwraca ostatnie użycie tokenów z wywołania `/api/explain`.

### Propozycja monitoringu

1. Użyj narzędzia typu UptimeRobot lub Better Uptime i ustaw monitorowanie `GET https://jasnepismo.pl/api/health`.
2. Sprawdzanie co 5 minut to dobre ustawienie dla serwisu produkcyjnego.
3. Jeśli monitor zgłosi błąd, to oznacza problem z hostingiem, DNS lub backendem.

### Monitoring

Repository nie zawiera automatycznego workflowu monitorującego. Jeśli chcesz monitorować serwis, użyj zewnętrznego narzędzia (np. UptimeRobot lub Better Uptime) i ustaw monitor na `GET https://<twoja-domena>/api/health`.

### Przykłady użycia

```bash
curl -X GET https://jasnepismo.pl/api/health
curl -X GET https://jasnepismo.pl/api/usage
curl -X POST https://jasnepismo.pl/api/explain \
  -H "Content-Type: application/json" \
  -d '{"text":"To jest testowy dokument do wyjaśnienia."}'
```

> Uwaga: OpenAI nie udostępnia przez standardowy endpoint informacji o "pozostałych tokenach" w koncie. Tutaj monitorujemy zużycie tokenów w ostatnim żądaniu. Jeśli chcesz pełniejsze raporty miesięczne, użyj panelu OpenAI lub dedykowanego API do rozliczeń.

## End-to-end tests

Playwright tests cover the main page and interactive UI behaviors:

- 	ests/e2e/index.spec.js — basic page load and hero checks
- 	ests/e2e/ui.spec.js — form, modal and file input behavior

Run them locally with:

`ash
# install Playwright test runner and browsers (one-time)
npm install -D @playwright/test
npx playwright install

# run e2e tests
npm run test:e2e
`

Unit tests are now in the specs/ folder and can be run with:
`ash
node --test ./specs
`
