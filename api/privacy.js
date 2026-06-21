// Simple privacy endpoint: informs about retention and supports a delete request stub.
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = function handler(req, res) {
  const method = req && req.method ? req.method.toUpperCase() : 'GET';
  if (method === 'GET') {
    return res.status(200).json({
      message:
        'Nie przechowujemy trwałych kopii dokumentów. Pliki przesyłane są tylko do przetworzenia i usuwane z zasobów tymczasowych. Jeśli chcesz usunąć dane pomocnicze, użyj POST /api/privacy/delete z identyfikatorem żądania.',
    });
  }

  if (method === 'POST') {
    // Accept deletion requests: { requestId, contact }
    try {
      const body = req.body || {};
      const requestId = body.requestId || body.id || null;
      const contact = body.contact || body.email || null;
      const rec = {
        requestId: requestId || 'unknown',
        contact: contact || 'none',
        timestamp: new Date().toISOString(),
      };
      const logfile = path.join(os.tmpdir(), 'jasnepismo-privacy-requests.log');
      try {
        fs.appendFileSync(logfile, JSON.stringify(rec) + '\n');
      } catch (e) {
        // best effort logging
        console.error('privacy log error (safe):', e && e.message ? e.message : e);
      }
      // In a system with persistent storage, implement deletion workflow here.
      return res.status(202).json({ message: 'Żądanie usunięcia przyjęte.', request: rec });
    } catch (e) {
      return res.status(500).json({ error: 'Błąd serwera przy obsłudze żądania.' });
    }
  }

  res.setHeader && res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Metoda niedozwolona. Użyj GET lub POST.' });
};
