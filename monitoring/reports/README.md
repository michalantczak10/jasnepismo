Ten katalog zawiera raporty porównujące zużycie tokenów:
- token-report-<timestamp>.json — szczegółowe dane dla każdej próbki
- token-report-<timestamp>.csv — CSV z syntetycznymi wynikami

Uruchamianie lokalnie:
- Mock (bez klucza OpenAI): npm run report:tokens:mock
- Live (z kluczem w OPENAI_API_KEY): export OPENAI_API_KEY=... && npm run report:tokens

Filtracja dat (zalecane):
- Możesz ograniczyć analizę do ostatnich N dni: node scripts/aggregate-reports.js --days 30
- Lub określić zakres dat: node scripts/aggregate-reports.js --from 2026-05-01 --to 2026-05-31
- Podobnie dla podsumowania: node scripts/report-summary.js --days 30

Interpretacja:
- delta_theoretical: estymacja tokenów bez kompresji
- delta_compressed: estymacja tokenów po lokalnej kompresji
- delta_actual: rzeczywiste total_tokens zwrócone przez API OpenAI
- saved_by_compression_pct: ile procent estymacji teoretycznej oszczędzono lokalną kompresją
- saved_vs_actual_pct: różnica między estymacją teoretyczną a rzeczywistym użyciem (wyjaśnienie poniżej)

Uwaga: w trybie mock wartości są symulowane. W trybie live raportuje rzeczywiste wywołania i aktualizuje liczniki w monitoring/.

Rekomendacja:
- Uruchamiaj analizę za pomocą --days 30 (ostatnie 30 dni) aby uzyskać stabilny obraz trendów.
- Używaj trybu mock do testów CI i lokalnych sprawdzeń. Tryb live wymaga sekretu REPORT_OPENAI=1 i OPENAI_API_KEY i będzie zużywał tokeny.

Automatyzacja (uruchamianie zdalne przy użyciu GitHub Actions lub gh CLI):

- Ręczne wywołanie workflow (zalecane, używa sekretów repo):
  - gh workflow run token-report.yml --ref main -f mode=live -f days=30
  - gh run watch
  - gh run list --workflow=token-report.yml
  - gh run download <RUN-ID> -D ./monitoring/reports

- Szybki skrypt (lokalny):
  - PowerShell: .\scripts\trigger-token-report.ps1 -Mode live -Days 30
  - Bash: ./scripts/trigger-token-report.sh live 30
  - Skrypty preferują gh CLI; jeśli go nie ma, spróbują użyć GITHUB_TOKEN do wywołania REST API.

- Gdy workflow zakończy, artefakty (monitoring/reports/*) zostaną załadowane i możesz pobrać je do lokalnego katalogu przez gh run download albo z interfejsu Actions.

Bezpieczeństwo:
- Live run zużywa tokeny. Włącz go tylko po ustawieniu repo secretów: OPENAI_API_KEY oraz REPORT_OPENAI=1.
- Jeśli nie chcesz używać gh CLI, ustaw GITHUB_TOKEN (z prawami do uruchamiania workflow) i użyj skryptów fallback.

