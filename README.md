# Jasne pismo — wyjaśnianie pism urzędowych

Prosta aplikacja webowa do wyjaśniania pism urzędowych z wykorzystaniem AI. Umożliwia wklejenie tekstu lub przesłanie skanu/dokumentu i wygenerowanie prostego wyjaśnienia (treść jest wysyłana do OpenAI wyłącznie w celu wygenerowania odpowiedzi).

## Co znajduje się w projekcie

- `index.html` — strona główna
- `styles.css` — styl wizytówki
- `img/` — obrazy używane na stronie
- `favicon.svg`, `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon-192x192.png`, `favicon-512x512.png` — ikony i favicona
- `apple-touch-icon.png`, `site.webmanifest`, `robots.txt`, `sitemap.xml` — pliki statyczne serwowane z katalogu głównego
- `.gitignore` — reguły Git

## Jak używać

1. Otwórz wdrożoną stronę (np. na Vercel) albo uruchom projekt lokalnie.
2. Wklej treść dokumentu lub prześlij plik (obraz/PDF/DOC/DOCX/DOTX/ODT/RTF/TXT).
3. Kliknij przycisk "Wyjaśnij".
4. Otrzymasz proste wyjaśnienie oraz sugestie kolejnych kroków.
5. Możesz pobrać wyjaśnienie jako plik tekstowy.

## Uwagi

Ten projekt teraz obsługuje prostą wersję backendu na Vercel i przetwarzanie obrazów OCR w przeglądarce.

## Uruchomienie z API

Ten projekt używa backendu Vercel Serverless do obsługi zapytań OpenAI.

### Endpointy API

- `GET /api/health`
  - Sprawdza, czy usługa działa.
  - Zwraca JSON z informacją o statusie, czasie działania i środowisku.
- `GET /api/usage`
  - Zwraca dane o ostatnim użyciu tokenów z wywołania `/api/explain`.
- `GET /api/costs`
  - Pobiera dzienne dane kosztów OpenAI z endpointu organizacyjnego.
- `POST /api/explain`
  - Przyjmuje JSON z polem `text` i zwraca wyjaśnienie plus informacje o zużyciu tokenów.

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
curl -X GET https://jasnepismo.pl/api/costs
```

Możesz też użyć daty w query:

```bash
curl -X GET "https://jasnepismo.pl/api/costs?date=2026-05-25"
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
- `GET /api/costs` — pobiera dzienne dane kosztów OpenAI dla wybranego dnia. Endpoint jest chroniony i wymaga autoryzacji: ustawienia zmiennej środowiskowej `ADMIN_API_TOKEN` oraz przesłania tego tokena w nagłówku `x-admin-token` lub `Authorization: Bearer <token>`.

Wymagane zmienne środowiskowe dla tych funkcji:
- `OPENAI_ADMIN_KEY` — (opcjonalnie) klucz organizacyjny OpenAI wykorzystywany przez `/api/costs`. Jeśli nie jest ustawiony, `/api/costs` zwróci błąd 501.
- `ADMIN_API_TOKEN` — tajny token administracyjny wymagany do uwierzytelnienia żądań do `/api/costs`.
- `OCR_WORKER_URL` — (opcjonalnie) URL zewnętrznego serwisu OCR. Jeśli jest ustawiony, pliki przesłane do `/api/explain` zostaną przesłane do tego serwisu (endpoint `/process`) w celu wyodrębnienia tekstu.

Zachowaj bezpieczeństwo: nie przechowuj tokenów i kluczy w repozytorium. Ustaw je w konfiguracji środowiska hostingu (Vercel, Cloud Run, itp.).

## Deployment on Vercel

1. Create a new project in Vercel and connect it to the `jasnepismo` repository.
2. Make sure `vercel.json` is present in the repo root.
3. Add the environment variable in Vercel:
   - `OPENAI_API_KEY`
4. Add the admin variables if you use protected endpoints:
   - `OPENAI_ADMIN_KEY`
   - `ADMIN_API_TOKEN`
   - `MONITOR_ADMIN_TOKEN` (optional, if you want the monitor workflow to hit protected routes)
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
- `GET /api/costs` pobiera dzienne dane kosztów OpenAI dla bieżącego dnia lub podanej daty.

### Propozycja monitoringu

1. Użyj narzędzia typu UptimeRobot lub Better Uptime i ustaw monitorowanie `GET https://jasnepismo.pl/api/health`.
2. Sprawdzanie co 5 minut to dobre ustawienie dla serwisu produkcyjnego.
3. Jeśli monitor zgłosi błąd, to oznacza problem z hostingiem, DNS lub backendem.

### GitHub Actions monitoring

W repozytorium dodałem automatyczny monitoring na GitHub Actions:

- plik: `.github/workflows/monitor.yml`
- skrypt: `scripts/check-monitor.js`

Ten workflow uruchamia się co 6 godzin i wykonuje dwa sprawdzenia:

- `GET /api/health`
- `GET /api/usage`

Jeśli któreś z nich nie zwróci oczekiwanej odpowiedzi, workflow zakończy się błędem.

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

- `e2e/index.spec.js` — basic page load and hero checks
- `e2e/ui.spec.js` — form, modal and file input behavior

Setup and run locally:

```bash
# install Playwright test runner and browsers (one-time)
npm install -D @playwright/test
npx playwright install

# run e2e tests
npm run test:e2e
```

Note: CI runners must also install Playwright and its browser binaries before executing `npm run test:e2e`. Use `npx playwright install` in your workflow. 