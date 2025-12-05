export default function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.json({
        binId: process.env.JSONBIN_BIN_ID,
        apiKey: process.env.JSONBIN_API_KEY
    });
}
