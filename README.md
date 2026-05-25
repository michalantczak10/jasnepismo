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

## Uwagi

Ten projekt teraz obsługuje prostą wersję backendu na Vercel i przetwarzanie obrazów OCR w przeglądarce.

## Uruchomienie z API

- `api/explain.js` — endpoint darmowego wyjaśnienia.

## Wymagane zmienne środowiskowe

- `OPENAI_API_KEY` — klucz OpenAI dla endpointu `/api/explain`.
- `OPENAI_MODEL` — opcjonalnie, model OpenAI do użycia. Domyślnie `gpt-4.1-mini`.

## Deployment on Vercel

1. Create a new project in Vercel and connect it to the `jasnepismo` repository.
2. Make sure `vercel.json` is present in the repo root.
3. Add the environment variable in Vercel:
   - `OPENAI_API_KEY`
4. Deploy the project. The site is served statically and backend routes are handled by Vercel Serverless Functions in the `api/` folder.

## Jak testować

1. Otwórz wdrożoną stronę na Vercel.
2. Wklej tekst pisma urzędowego i wybierz przycisk "Wyjaśnij za darmo".

