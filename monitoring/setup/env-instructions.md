Enabling USE_TIKTOKEN and environment variables

1) Purpose
- USE_TIKTOKEN=1 enables the local tiktoken-based estimator for accurate token counts. If not set, the code falls back to a safe heuristic (length/4).

2) Install and enable locally
- Run: ./scripts/install-tiktoken.sh
- After successful install, set USE_TIKTOKEN=1 in your runtime environment.

3) Hosting platforms
- Vercel: Project Settings → Environment Variables → add USE_TIKTOKEN = 1 for Production.
- Netlify: Site settings → Build & deploy → Environment → add USE_TIKTOKEN = 1.
- Heroku: Settings → Reveal Config Vars → add USE_TIKTOKEN = 1.
- Docker: set ENV in Dockerfile or docker run -e USE_TIKTOKEN=1 ...

4) GitHub Actions / Secrets
- To allow Actions to use tiktoken-enabled logic or to store METRICS_URL/METRICS_TOKEN set repo secrets. Use the provided script:
  ./scripts/set-github-secrets.sh owner/repo "https://your-host/api/metrics" "<METRICS_TOKEN>"

5) Notes
- tiktoken prebuilt binaries may not be available on all platforms. The install script prints guidance if installation fails.
- Enabling USE_TIKTOKEN only affects local token estimation accuracy; it does not change API usage or costing.
