const { parseForm, extractTextFromFile } = require('./extract-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj POST.' });
  }

  try {
    const parsed = await parseForm(req);
    const files = parsed.files;
    const file = files && (files.documentFile || files.file || Object.values(files)[0]);
    if (!file) return res.status(400).json({ error: 'Brak pliku w żądaniu.' });

    const text = await extractTextFromFile(file);
    return res.status(200).json({ extractedText: text || '' });
  } catch (err) {
    console.error('Error in /api/extract:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Błąd serwera podczas ekstrakcji pliku.' });
  }
};