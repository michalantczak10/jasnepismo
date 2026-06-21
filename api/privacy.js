// Simple privacy endpoint: informs about retention and supports a delete request stub.
module.exports = function handler(req, res) {
  const method = (req && req.method ? req.method.toUpperCase() : 'GET');
  if (method === 'GET') {
    return res.status(200).json({
      message:
        'Nie przechowujemy trwałych kopii dokumentów. Pliki przesyłane są tylko do przetworzenia i usuwane z zasobów tymczasowych. Jeśli chcesz usunąć dane pomocnicze, skontaktuj się z administratorem.',
    });
  }

  if (method === 'DELETE') {
    // If you later add persistent storage, implement deletion logic here.
    return res.status(200).json({ message: 'Jeśli przechowywano dane, zostałyby usunięte.' });
  }

  res.setHeader && res.setHeader('Allow', 'GET, DELETE');
  return res.status(405).json({ error: 'Metoda niedozwolona. Użyj GET lub DELETE.' });
};
