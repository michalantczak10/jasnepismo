# JasnePismo — wyjaśnianie pism urzędowych

Prosta aplikacja webowa do wyjaśniania pism urzędowych z wykorzystaniem AI. Umożliwia wklejenie tekstu lub przesłanie skanu dokumentu i wygenerowanie prostego wyjaśnienia.

## Co znajduje się w projekcie

- `index.html` — strona główna
- `styles.css` — styl wizytówki
- `img/` — obrazy używane na stronie
- `favicon.svg`, `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon-192x192.png`, `favicon-512x512.png` — ikony i favicona
- `apple-touch-icon.png`, `site.webmanifest`, `robots.txt`, `sitemap.xml` — pliki statyczne serwowane z katalogu głównego
- `.gitignore` — reguły Git

## Jak używać

1. Otwórz `index.html` w przeglądarce.
2. Wklej treść dokumentu lub prześlij obraz/skan dokumentu.
3. Kliknij przycisk "Wyjaśnij za darmo".
4. Otrzymasz prostą interpretację oraz sugestie kolejnych kroków.
5. Możesz pobrać wyjaśnienie jako plik tekstowy.

## Uwagi

Ten projekt teraz obsługuje prostą wersję backendu na Vercel i przetwarzanie obrazów OCR w przeglądarce.

## Uruchomienie z API

Ten projekt używa backendu Vercel Serverless do obsługi zapytań OpenAI.

### Endpointy API

- `GET /api/health`
  - Sprawdza, czy usługa działa.
  - Zwraca JSON z informacją o statusie, czasie działania i ostatnim użyciu tokenów.
- `GET /api/usage`
  - Zwraca dane o ostatnim użyciu tokenów z wywołania `/api/explain`.
- `POST /api/explain`
  - Przyjmuje JSON z polem `text` i zwraca wyjaśnienie plus informacje o zużyciu tokenów.

### Przykłady użycia

#### Sprawdzenie zdrowia usługi

```bash
curl -X GET https://www.jasnepismo.pl/api/health
```

#### Sprawdzenie użycia tokenów

```bash
curl -X GET https://www.jasnepismo.pl/api/usage
```

#### Wysłanie żądania do wyjaśnienia

```bash
curl -X POST https://www.jasnepismo.pl/api/explain \
  -H "Content-Type: application/json" \
  -d '{"text":"To jest testowy dokument do wyjaśnienia."}'
```

#### Sprawdzenie rozliczeń OpenAI

```bash
curl -X GET https://www.jasnepismo.pl/api/billing
```

Możesz też użyć dat w query:

```bash
curl -X GET "https://www.jasnepismo.pl/api/billing?start_date=2026-05-01&end_date=2026-05-25"
```

Ten endpoint używa standardowego OpenAI `/v1/usage` i zwraca dane rozliczeniowe dla podanego okresu.

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

- `OPENAI_API_KEY` — klucz OpenAI dla endpointu `/api/explain`.
- `OPENAI_MODEL` — opcjonalnie, model OpenAI do użycia. Domyślnie `gpt-4.1-mini`.
  - Przykłady: `gpt-4.1`, `gpt-4o`, `gpt-4.1-mini`.
  - Upewnij się, że dany model jest dostępny na twoim koncie OpenAI.

## Deployment on Vercel

1. Create a new project in Vercel and connect it to the `jasnepismo` repository.
2. Make sure `vercel.json` is present in the repo root.
3. Add the environment variable in Vercel:
   - `OPENAI_API_KEY`
4. Deploy the project. The site is served statically and backend routes are handled by Vercel Serverless Functions in the `api/` folder.

## Jak testować

1. Otwórz wdrożoną stronę na Vercel.
2. Wklej tekst pisma urzędowego i wybierz przycisk "Wyjaśnij za darmo".

## Monitoring i zdrowie serwisu

Aby zewnętrzny serwis monitorujący przekonał się, że aplikacja działa, możesz podłączyć adres:

- `https://www.jasnepismo.pl/api/health`
- `https://www.jasnepismo.pl/api/usage`

Ten endpoint zwraca JSON z informacją:

- `status: ok`
- `timestamp`: aktualna data i godzina
- `uptime_seconds`: czas działania funkcji serwera
- `environment`: np. `vercel`
- `model`: używany model OpenAI
- `last_usage`: dane o ostatnim użyciu tokenów w formacie OpenAI

Dodatkowo:

- `POST /api/explain` zwraca pole `usage` wraz z wyjaśnieniem, co pozwala monitorować zużycie tokenów przy każdym żądaniu.
- `GET /api/usage` zwraca ostatnie użycie tokenów z wywołania `/api/explain`.
- `GET /api/billing` pobiera aktualne dane rozliczeniowe OpenAI dla bieżącego miesiąca.

### Propozycja monitoringu

1. Użyj narzędzia typu UptimeRobot lub Better Uptime i ustaw monitorowanie `GET https://www.jasnepismo.pl/api/health`.
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
curl -X GET https://www.jasnepismo.pl/api/health
curl -X GET https://www.jasnepismo.pl/api/usage
curl -X POST https://www.jasnepismo.pl/api/explain \
  -H "Content-Type: application/json" \
  -d '{"text":"To jest testowy dokument do wyjaśnienia."}'
```

> Uwaga: OpenAI nie udostępnia przez standardowy endpoint informacji o "pozostałych tokenach" w koncie. Tutaj monitorujemy zużycie tokenów w ostatnim żądaniu. Jeśli chcesz pełniejsze raporty miesięczne, użyj panelu OpenAI lub dedykowanego API do rozliczeń.

