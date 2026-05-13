# Szkolne gazetki

Sklep z gotowymi grafikami PDF do gazetki szkolnej dla nauczycieli.

## 📋 Opis

Szkolne gazetki to prosta, responsywna strona e-commerce oferująca gotowe szablony i grafiki PDF do gazetki szkolnej dla nauczycieli. Projekt wykorzystuje TypeScript dla typowania i bezpieczeństwa kodu.

## 🚀 Funkcjonalności

- **Dynamiczny koszyk licencji** - dodawanie produktów z automatycznym przeliczaniem liczby licencji
- **Checkout z walidacją** - walidacja telefonu i uwag
- **Animacje** - płynne animacje przy dodawaniu produktów
- **Responsywny design** - działa na wszystkich urządzeniach
- **Dostępność (a11y)** - etykiety ARIA i stany focus dla czytników ekranu
- **SEO** - zoptymalizowane metatagi
- **MongoDB** - pełna archiwizacja zamówień
- **Powiadomienia e-mail** - automatyczne wiadomości o nowych zamówieniach

## 🌐 Quick Start - Deployment

Chcesz od razu wdrożyć aplikację na produkcję?

**📘 [Kompletny przewodnik wdrożenia →](DEPLOYMENT-GUIDE.md)**

- Backend/API → Vercel Functions
- Frontend → Vercel (darmowy)
- Baza danych → MongoDB Atlas lub inny klaster MongoDB

Czas konfiguracji: **~15 minut**

## 🌿 Workflow gałęzi

Aktualny model pracy:

- `develop` - codzienna praca i testy zmian
- `main` - wyłącznie release na produkcję

Zasady:

1. Każdą zmianę przygotuj i zweryfikuj na `develop`.
2. Na produkcję wypychaj tylko po merge do `main`.
3. Każdy push na `main` uruchamia automatyczny smoke test produkcyjny.
4. Monitoring health check działa cyklicznie co 15 minut jako pasywna kontrola stanu API.

## 🛠️ Technologie

- **Frontend**: Vite, TypeScript, CSS3, HTML5
- **Backend**: Vercel Serverless Function (`api/orders.js`, `api/health.js`)
- **Baza danych**: MongoDB Atlas lub lokalne MongoDB
- **Email**: Resend API
- **Testy E2E**: Playwright

## 📦 Instalacja

1. Sklonuj repozytorium:
```bash
git clone https://github.com/michalantczak10/szkolnegazetki.git
cd szkolnegazetki
```

2. Zainstaluj zależności:
```bash
npm install
```

3. (Opcjonalnie) Jeżeli chcesz uruchomić lokalny backend Vercel, zainstaluj `vercel` CLI i skonfiguruj zmienne środowiskowe w Vercel.

## 🏃 Uruchomienie

### Development frontend
```bash
npm run dev
```
Otwórz `http://localhost:5173`.

### Development frontend + API (zalecane do testowania zamówień)
```bash
npm run dev:full
```
Uruchamia równolegle frontend (`vite`) i lokalny serwer API zamówień na `http://localhost:3000`.

### Produkcyjny build frontendu
```bash
npm run build
```
Wynikowe pliki zostaną zbudowane do `dist`.

### Lokalny backend (opcjonalny)
```bash
npm run dev:api
```
Uruchamia lokalny serwer API dla `orders` i `health` bez pośrednictwa `vercel dev`, co eliminuje niestabilność procesu na Windows.

## ⚙️ Konfiguracja

### Frontend - API Configuration

Frontend komunikuje się z backendem za pomocą `VITE_API_BASE_URL`.

- W produkcji: jeśli nie ustawisz wartości, frontend użyje `/api/orders` na tej samej domenie, na której działa aplikacja.
- W dewelopmencie: możesz ustawić lokalny adres backendu, np. `http://localhost:3000`.

Przykład:
```env
VITE_API_BASE_URL=http://localhost:3000
```

### MongoDB

Aby backend mógł zapisywać zamówienia, wymagany jest `MONGODB_URI`.

#### Lokalne MongoDB
```bash
# Uruchom MongoDB lokalnie
mongod
```

W `Vercel` ustaw:
```env
MONGODB_URI=mongodb://localhost:27017/szkolnegazetki
```

#### MongoDB Atlas
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/szkolnegazetki?retryWrites=true&w=majority
```

### Email (Resend)

Backend wysyła powiadomienia o nowych zamówieniach na adres ustawiony w `ORDER_EMAIL`.

**📧 [Szczegóły konfiguracji email →](EMAIL-SETUP.md)**

## 🧩 Skrypty npm (root)

- `npm run dev` - uruchamia frontend w trybie developerskim
- `npm run dev:test` - uruchamia frontend pod testy Playwright
- `npm run build` - buduje frontend do `dist`
- `npm run test:e2e:smoke` - szybkie testy E2E
- `npm run test:api` - szybki test backendu `api/orders`
- `npm run test:verify` - pełny lokalny pakiet walidacji: build + API + coverage + smoke E2E
- `npm run test:e2e:all` - pełny zestaw testów E2E
- `npm run test:e2e:live` - checkout live testy E2E (wymagane `ENABLE_LIVE_E2E=true`)
- `npm run test:prod:smoke` - smoke test produkcji
- `npm run ops:local:check` - lokalny przegląd repozytorium
- `npm run ops:local:cleanup` - usuwanie lokalnie scalonych gałęzi

## 🧪 Testy E2E

Projekt ma dwa profile testów Playwright:

1. `smoke` - szybkie testy bez efektów ubocznych (bez tworzenia realnych zamówień):
```bash
npm run test:e2e:smoke
```

`npm run test:e2e:all` używa domyślnego profilu E2E i celowo pomija test live checkout.

2. `live` - testy realnego checkoutu (tworzą prawdziwe zamówienia):
```bash
$env:ENABLE_LIVE_E2E='true'; npm run test:e2e:live
```
Konfiguracja live wymusza `workers=1` i uruchamia tylko `checkout-live.spec.ts`, aby uniknąć równoległego tworzenia wielu realnych zamówień. Bez flagi `ENABLE_LIVE_E2E=true` testy live są pomijane.

3. `prod smoke` - szybkie testy produkcji bez tworzenia realnych zamówień:
```bash
npm run test:prod:smoke
```

Automatyzacja CI:

- Workflow `CI` uruchamia `npm run build` oraz `npm run test:e2e:smoke` na `develop`, `main` i PR.

Opcjonalnie możesz wskazać inny URL:
```bash
PROD_BASE_URL=https://twoj-url npm run test:prod:smoke
```

### Izolacja testów i produkcji na jednym klastrze MongoDB

Jeśli używasz tylko jednego klastra MongoDB Free, testy live są odseparowane logicznie:

1. `NODE_ENV=test` używa osobnej kolekcji (`orders_test` domyślnie).
2. Możesz ustawić osobny adres odbioru maili testowych (`ORDER_EMAIL_TEST`).
3. Testowe zamówienia mają automatyczne czyszczenie przez TTL (`TEST_ORDER_TTL_DAYS`).

Konfiguracja znajduje się w:

1. `api/orders.js`
2. `api/health.js`
3. `playwright.live.config.ts`

## 📂 Struktura projektu

```
szkolnegazetki.pl/
├── api/                    # Vercel Serverless functions
│   ├── orders.js           # Obsługa zamówień
│   └── health.js           # Health check API
├── index.html
├── app.ts
├── style.css
├── favicon/
├── img/
├── modules/
├── config/
├── public/
├── types.ts
├── vite.config.ts
├── vite-env.d.ts
├── .github/workflows/
├── package.json            # Rootowa konfiguracja npm
├── tsconfig.json           # Konfiguracja TypeScript
└── vercel.json             # Ustawienia Vercel
```

## 🔌 Endpointy API

### Zamówienia nauczyciela

**POST `/api/orders`** - Złóż nowe zamówienie
```json
{
  "customerName": "Anna Nowak",
  "customerEmail": "zamowienia@szkolnegazetki.pl",
  "customerPhone": "512345678",
  "paymentMethod": "bank_transfer",
  "notes": "Licencje do 2 projektów klasowych",
  "items": [
    {"name": "Plakaty szkolne PDF", "price": 45, "qty": 2}
  ]
}
```

`qty` oznacza liczbę licencji nauczyciela (np. do kilku klas lub projektów).

### Health check

**GET `/api/health`** - Status API i bazy danych
```
{
  "status": "ok",
  "service": "szkolnegazetki-api",
  "environment": "production",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "database": {
    "connected": true
  }
}
```

## 🧹 Lokalny housekeeping

Szybki przegląd stanu lokalnego środowiska:

```bash
npm run ops:local:check
```

Automatyczne usunięcie lokalnych gałęzi, które są już zmergowane:

```bash
npm run ops:local:cleanup
```

## 💾 Schemat zamówienia

Każde zamówienie nauczyciela w MongoDB zawiera:
```json
{
  "_id": "ObjectId",
  "customerName": "string",
  "customerEmail": "string",
  "customerPhone": "string",
  "paymentMethod": "bank_transfer|blik",
  "notes": "string",
  "items": [
    {"name": "string", "price": "number", "qty": "number"}
  ],
  "productsTotal": "number",
  "total": "number",
  "status": "pending_payment",
  "paymentStatus": "pending",
  "transferTitle": "string",
  "paymentTarget": "string",
  "orderRef": "string",
  "environment": "development|production|test",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

W polu `items[].qty` przechowywana jest liczba licencji dla danego produktu.

## 🎨 Produkty

1. **Plakaty szkolne PDF** - gotowe materiały do gazetki szkolnej (45 zł)
2. **Szablony gazetki PDF** - profesjonalne layouty w formacie PDF (52 zł)

## 🔧 Konfiguracja

Kolory i inne zmienne można łatwo dostosować w `:root` w pliku `style.css`:

```css
:root {
  --color-primary: #b30000;
  --color-accent: #ffcc00;
  --color-bg: #fff8f0;
  /* ... */
}
```

## 📱 Responsywność

Strona jest w pełni responsywna i korzysta z breakpointów:
- Mobile: < 480px
- Tablet: < 768px  
- Desktop: > 768px

## ♿ Dostępność

Projekt spełnia standardy dostępności:
- ARIA labels dla wszystkich interaktywnych elementów
- Focus states dla nawigacji klawiaturą
- Semantyczny HTML
- Odpowiedni kontrast kolorów

## 📄 Licencja

MIT

## 👨‍💻 Autor

Szkolne gazetki © 2026
