OCR Worker

This worker accepts multipart/form-data POST /process with a file field (file, documentFile) or a text field `text`.
It returns JSON { text } containing extracted text.

Deployment suggestions:
- Render (Docker): push this folder as a service using the provided Dockerfile.
- Cloud Run: build and deploy the Dockerfile; set concurrency and memory according to expected OCR load.

Environment variables:
- TESSERACT_LANGS (optional): comma-separated languages, default: pol,eng

After deploying, set Vercel environment variable OCR_WORKER_URL to the worker base URL (e.g. https://worker.example.com) and redeploy the site.
