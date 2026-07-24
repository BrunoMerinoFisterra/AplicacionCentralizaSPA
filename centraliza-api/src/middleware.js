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

module.exports = { requireUser, requireAdmin };
