# Deployment Guide

Ten dokument opisuje aktualny model wdrożenia dla projektu:

- frontend: Vercel
- backend: Vercel Serverless Functions
- baza: MongoDB Atlas lub lokalne MongoDB

## 1. Wymagane sekrety

### Vercel

Obowiązkowe:
- **MONGODB_URI** - connection string do MongoDB Atlas lub lokalnego MongoDB
- **ORDER_EMAIL** - adres e-mail na który wysyłać powiadomienia o zamówieniach
- **RESEND_API_KEY** - API key do Resend (email service)
- **RESEND_FROM_EMAIL** - adres e-mail nadawcy w Resend
- **NODE_ENV** - production

Frontend nie wymaga dodatkowych sekretów do działania w Vercel, jeśli wykorzystuje te same funkcje.

## 2. Aktualny pipeline

Repo pracuje w modelu:

- develop: praca deweloperska
- main: produkcja

Publikacja produkcji:

1. push zmian na develop
2. merge develop do main
3. Vercel automatycznie deployuje frontend i funkcje serverless

W tym repo jest skonfigurowane:

- Vercel buduje frontend komendą `npm run build`
- Output frontendu to folder `dist`
- Funkcje backendowe są wdrażane z katalogu `api/` (Vercel Serverless Functions)

## 3. Szybka weryfikacja po deployu

1. API health

GET https://szkolnegazetki.pl/api/health

Oczekiwany kształt odpowiedzi:

{
  "status": "ok",
  "service": "szkolnegazetki-api",
  "environment": "production",
  "timestamp": "...",
  "database": {
    "connected": true
  }
}

2. Smoke testy frontendu na produkcji

```bash
npm run test:prod:smoke
```

3. Smoke testy lokalnie

```bash
npm run test:e2e:smoke
```

## 4. Merge strategy

### Aby dodać zmiany do produkcji:

1. Pracuj na `develop`
2. Po testach na develop, stwórz PR `develop` → `main`
3. Zmerguj do `main`
4. Vercel automatycznie deployuje aplikację z `main`

**Ważne**: Nigdy nie pushuj bezpośrednio na `main`, jeśli można użyć PR.

## 5. Najczęstsze problemy

1. Vercel: `vite` command not found

- Upewnij się, że Vercel instaluje zależności w katalogu głównym repozytorium.
- `vercel.json` powinien zawierać poprawny `installCommand`.

2. API health ma status degraded

- Sprawdź `MONGODB_URI` w Vercel.
- Upewnij się, że baza jest dostępna.

3. Brak maili o zamówieniach

- Sprawdź `RESEND_API_KEY`, `RESEND_FROM_EMAIL` i `ORDER_EMAIL` w Vercel.
- Sprawdź logi funkcji serverless w Vercel.

## 6. Troubleshooting w trakcie development

### Frontend nie buduje się lokalnie

```bash
npm install && npm run build
```

### Lokalne testy frontendowe

```bash
npm run test:e2e:smoke
```

### Zmiana konfiguracji Vercel

W Vercel ustaw te same zmienne środowiskowe, co w produkcji.

## 7. Operacyjna checklista

Do release i kontroli produkcji używaj:

- README.md
- PRODUCTION-CHECKLIST.md

