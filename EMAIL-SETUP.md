# Konfiguracja email (Resend)

## Co robi backend

Funkcja serverless `api/orders.js`:

1. zapisuje zamówienie do MongoDB
2. zwraca numer zamówienia nauczycielowi
3. próbuje wysłać email z powiadomieniem o zamówieniu

Wysyłka email nie blokuje zapisu zamówienia. Jeśli Resend zgłosi błąd, zamówienie i tak zostanie zapisane.

## Wymagane zmienne środowiskowe

W Vercel ustaw:

- `MONGODB_URI`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `ORDER_EMAIL`

Opcjonalnie dla testów live:

- `ORDER_EMAIL_TEST`

Przykład:

```env
RESEND_API_KEY=re_twoj_klucz_api
RESEND_FROM_EMAIL=noreply@szkolnegazetki.onresend.com
ORDER_EMAIL=zamowienia@szkolnegazetki.pl
```

Uwagi:

- konfiguracja email dotyczy backendu w Vercel
- jeśli `ORDER_EMAIL` nie jest ustawiony, powiadomienie może zostać pominięte
- jeśli `RESEND_FROM_EMAIL` nie jest ustawiony, backend użyje domyślnego `noreply@szkolnegazetki.onresend.com`

## Brak konfiguracji Resend

- jeśli `RESEND_API_KEY` nie jest ustawiony, backend pominie wysyłkę maila
- zamówienie nadal zapisze się do MongoDB
- w logach pojawi się informacja, że Resend nie jest skonfigurowany

## Jak przetestować

1. sprawdź logi funkcji serverless w Vercel
2. wykonaj testowe zamówienie przez frontend lub `POST /api/orders`
3. potwierdź, że email dotarł na `ORDER_EMAIL`
4. jeśli używasz testów live, sprawdź `ORDER_EMAIL_TEST`

W logach szukaj:

- `EMAIL accepted by Resend`
- `EMAIL rejected by Resend`
- `EMAIL send request failed`
- `Pominięto wysyłkę maila — Resend nie jest skonfigurowany`

## Najczęstsze problemy

1. Brak maili

- zły `RESEND_API_KEY`
- niepoprawny `RESEND_FROM_EMAIL`
- wiadomości trafiają do spamu

2. Mail nie wychodzi, ale zamówienie jest zapisane

To wciąż oczekiwane zachowanie. System nie traci zamówienia przez problem z email.

## Uwaga o licencjach

W danych zamówienia pole `items[].qty` oznacza liczbę licencji nauczyciela (np. do kilku klas/projektów), a nie liczbę fizycznych sztuk.

3. Rozdzielenie produkcji i testów

Jeśli używasz live testów, ustaw `ORDER_EMAIL_TEST`, aby testowe zamówienia nie trafiały na główną skrzynkę.

## Bezpieczeństwo

Nie commituj plików `.env` do repo. Sekrety trzymaj w zmiennych środowiskowych Vercel.
