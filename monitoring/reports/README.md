Ten katalog zawiera raporty porównujące zużycie tokenów:
- token-report-<timestamp>.json — szczegółowe dane dla każdej próbki
- token-report-<timestamp>.csv — CSV z syntetycznymi wynikami

Uruchamianie lokalnie:
- Mock (bez klucza OpenAI): npm run report:tokens:mock
- Live (z kluczem w OPENAI_API_KEY): export OPENAI_API_KEY=... && npm run report:tokens

Interpretacja:
- delta_theoretical: estymacja tokenów bez kompresji
- delta_compressed: estymacja tokenów po lokalnej kompresji
- delta_actual: rzeczywiste total_tokens zwrócone przez API OpenAI
- saved_by_compression_pct: ile procent estymacji teoretycznej oszczędzono lokalną kompresją
- saved_vs_actual_pct: różnica między estymacją teoretyczną a rzeczywistym użyciem (wyjaśnienie poniżej)

Uwaga: w trybie mock wartości są symulowane. W trybie live raportuje rzeczywiste wywołania i aktualizuje liczniki w monitoring/.