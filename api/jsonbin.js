// api/jsonbin.js
export default async function handler(req, res) {
  const BIN_ID = process.env.JSONBIN_BIN_ID;
  const API_KEY = process.env.JSONBIN_API_KEY;

  const url = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      }
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from JSONBin' });
  }
}
