# ✅ Checklist produkcyjny Szkolne gazetki

## 0) Tryb release
- [ ] Wybierz tryb `quick` (zmiany docs/config bez ryzyka runtime) albo `full` (zmiany kodu frontend/backend).
- [ ] Jeśli to `full`, wykonaj wszystkie sekcje bez pomijania.

## 1) Go/No-Go (na `develop`)
- [ ] `git status` czysty (brak lokalnych zmian).
- [ ] `develop` zsynchronizowany z `origin/develop`.
- [ ] `npm run test:e2e:smoke` przechodzi lokalnie.
- [ ] `npm run test:prod:smoke` przechodzi przeciwko produkcji.
- [ ] `GET /api/health` zwraca `status=ok` i `database.connected=true`.
- [ ] Decyzja `GO` zapisana (kto i kiedy zatwierdził release).

## 2) Konfiguracja i bezpieczeństwo
- [ ] Zmienne środowiskowe poprawnie ustawione w Vercel.
- [ ] `MONGODB_URI`, `RESEND_API_KEY`, `ORDER_EMAIL`, `RESEND_FROM_EMAIL` ustawione dla produkcji.
- [ ] (Opcjonalnie dla testów live) `ORDER_EMAIL_TEST` ustawiony na osobny adres.
- [ ] Sekrety nie występują w repozytorium (pre-commit `secretlint` działa).
- [ ] Brak podatności `high/critical` w root: `npm audit --audit-level=high`.
- [ ] Brak podatności `high/critical` w client: `npm audit --audit-level=high`.
- [ ] Brak podatności `high/critical` w server: `npm audit --prefix server --audit-level=high`.

## 3) Release (`main`)
- [ ] Merge `develop -> main` wykonany (merge commit albo fast-forward zgodnie z polityką repo).
- [ ] Push na `origin/main` wykonany.
- [ ] Vercel zakończył deployment backendu i frontendu statusem `Ready`.
- [ ] Vercel ma konfigurację: `installCommand = npm install`.
- [ ] Vercel ma konfigurację: `buildCommand = npm run build`.
- [ ] Vercel ma konfigurację: `outputDirectory = dist`.
- [ ] Workflow `Production Smoke` uruchomił się po pushu na `main` i zakończył statusem `Success`.

## 4) Post-release (weryfikacja funkcjonalna)
- [ ] `npm run test:prod:smoke` przechodzi po deployu.
- [ ] `POST /api/orders` z pustym `items` zwraca `400`.
- [ ] `POST /api/orders` z niepoprawnym `phone` zwraca `400`.
- [ ] Legal pages i checkout działają poprawnie na produkcji.
- [ ] Brak błędów krytycznych w logach Vercel po deployu.

## 5) Monitoring i operacje
- [ ] Workflow `Production Health Monitor` działa cyklicznie (co 15 min).
- [ ] Ostatnie uruchomienia monitoringu nie mają błędów.
- [ ] Lokalny housekeeping wykonany: `npm run ops:local:check`.
- [ ] Niepotrzebne lokalne gałęzie usunięte: `npm run ops:local:cleanup`.

## 6) Rollback (gdy release nie spełnia warunków)
- [ ] Warunek rollback spełniony (np. smoke fail, health fail, błąd krytyczny checkout/API).
- [ ] Cofnij `main` do ostatniego stabilnego commita.
- [ ] Wypchnij rollback na `origin/main`.
- [ ] Potwierdź nowy deploy na Vercel (`Ready`).
- [ ] Ponownie uruchom `npm run test:prod:smoke` i sprawdź `/api/health`.
- [ ] Zapisz incydent: przyczyna, commit rollback, działania naprawcze.

## 7) Log release (do uzupełnienia przy każdym wdrożeniu)
- [ ] Data/godzina:
- [ ] Osoba wdrażająca:
- [ ] Commit release (`main`):
- [ ] Wynik `Production Smoke`:
- [ ] Wynik `/api/health`:
- [ ] Czy wykonano rollback: tak/nie
- [ ] Link do runu GitHub Actions:

---

Ta lista zakłada workflow: codzienna praca na `develop`, release wyłącznie przez `main`.
