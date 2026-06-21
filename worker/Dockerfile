FROM node:24-bullseye-slim

ENV NODE_ENV=production

# Install runtime dependencies for image processing and OCR (sharp, tesseract)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential python3 pkg-config libpng-dev libjpeg-dev libtiff-dev libvips-dev poppler-utils tesseract-ocr ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install production dependencies (including optional)
RUN npm ci --omit=dev

# Copy source
COPY . .

EXPOSE 3000

CMD ["node", "worker/ocr-worker.js"]
