const express = require('express');
const { requireUser } = require('./middleware');

const router = express.Router();

// Token OAuth de Finnegans con las credenciales del cliente (un solo cliente ⇒ .env).
// Finnegans devuelve el token como texto plano (no JSON).
async function getFinnegansAccessToken() {
  const clientId = process.env.FINNEGANS_CLIENT_ID;
  const clientSecret = process.env.FINNEGANS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('FINNEGANS_CLIENT_ID / FINNEGANS_CLIENT_SECRET no configurados.');
  }
  const tokenRes = await fetch(
    `https://api.teamplace.finneg.com/api/oauth/token?grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
  );
  if (!tokenRes.ok) {
    throw new Error(`Finnegans token request failed: ${tokenRes.status}`);
  }
  return tokenRes.text();
}

router.get('/token', requireUser, async (_req, res) => {
  try {
    const token = await getFinnegansAccessToken();
    return res.json({ token });
  } catch (err) {
    console.error('GET /finnegans/token error', err);
    return res.status(502).json({ error: 'Error al obtener token de Finnegans.' });
  }
});

module.exports = { router, getFinnegansAccessToken };
