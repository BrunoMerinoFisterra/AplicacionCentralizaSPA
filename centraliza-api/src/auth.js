const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('./db');
const { requireUser } = require('./middleware');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username y password son requeridos.' });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('username', sql.NVarChar, username)
      .query(`
        SELECT id, username, password_hash, full_name, role, is_active
        FROM centraliza_users
        WHERE username = @username
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const row = result.recordset[0];

    if (!row.is_active) {
      return res.status(403).json({ error: 'Cuenta inactiva.' });
    }

    const validPassword = await bcrypt.compare(password, row.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      { userId: row.id, username: row.username, role: row.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: row.id,
        username: row.username,
        fullName: row.full_name,
        role: row.role,
      },
    });
  } catch (error) {
    console.error('POST /auth/login error', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Empresas habilitadas para el usuario: exactamente las que le asignó un
// administrador. Sin asignaciones, la lista es vacía y no puede operar con
// ninguna empresa (no significa "todas").
router.get('/my-companies', requireUser, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('user_id', sql.Int, req.userId)
      .query(`SELECT company_code FROM centraliza_user_companies WHERE user_id = @user_id`);
    return res.json({ codes: result.recordset.map((r) => r.company_code) });
  } catch (err) {
    console.error('GET /auth/my-companies error', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Mismo shape que consume el WorkflowContext (solo compra)
router.get('/my-workflow', requireUser, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('user_id', sql.Int, req.userId)
      .query(`
        SELECT workflow_compra_codigo, workflow_compra_nombre,
               tipodoc_compra_codigo, tipodoc_compra_nombre
        FROM centraliza_users
        WHERE id = @user_id
      `);
    const row = result.recordset[0];
    return res.json({
      compra: row?.workflow_compra_codigo
        ? {
            codigo: row.workflow_compra_codigo,
            nombre: row.workflow_compra_nombre ?? '',
            subtipoCodigo: row.tipodoc_compra_codigo ?? null,
            subtipoNombre: row.tipodoc_compra_nombre ?? '',
          }
        : null,
    });
  } catch (err) {
    console.error('GET /auth/my-workflow error', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
