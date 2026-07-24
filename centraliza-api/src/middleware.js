const jwt = require('jsonwebtoken');

// JWT de centraliza_users: { userId, username, role }
function requireUser(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado.' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    req.userId = payload.userId;
    req.username = payload.username;
    req.role = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

function requireAdmin(req, res, next) {
  requireUser(req, res, () => {
    if (req.role !== 'admin') {
      return res.status(403).json({ error: 'Se requiere rol de administrador.' });
    }
    next();
  });
}

// Tope global de empresas habilitadas (ALLOWED_COMPANY_CODES="16,82").
// Si está definido, ningún usuario puede ver ni operar otra empresa, aunque
// tenga una asignación individual distinta o ninguna asignación.
function getAllowedCompanyCodes() {
  const raw = process.env.ALLOWED_COMPANY_CODES;
  if (!raw) return null; // sin tope: comportamiento original
  const codes = raw.split(',').map((c) => c.trim()).filter(Boolean);
  return codes.length > 0 ? codes : null;
}

module.exports = { requireUser, requireAdmin, getAllowedCompanyCodes };
