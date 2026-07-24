const express = require('express');
const { getPool, sql } = require('./db');
const { requireUser } = require('./middleware');

const router = express.Router();

router.post('/', requireUser, async (req, res) => {
  try {
    const { form_type, company_label, status, error_detail } = req.body;

    if (!form_type || !status) {
      return res.status(400).json({ error: 'form_type y status son requeridos.' });
    }

    const pool = await getPool();
    await pool.request()
      .input('user_id',       sql.Int,      req.userId)
      .input('username',      sql.NVarChar, req.username || null)
      .input('form_type',     sql.NVarChar, form_type)
      .input('company_label', sql.NVarChar, company_label || null)
      .input('status',        sql.NVarChar, status)
      .input('error_detail',  sql.NVarChar, error_detail || null)
      .query(`
        INSERT INTO centraliza_logs (user_id, username, form_type, company_label, status, error_detail)
        VALUES (@user_id, @username, @form_type, @company_label, @status, @error_detail)
      `);

    return res.json({ ok: true });
  } catch (err) {
    console.error('POST /log error', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.get('/mine', requireUser, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('user_id', sql.Int, req.userId)
      .query(`
        SELECT TOP 100 id, form_type, company_label, status, error_detail, created_at
        FROM centraliza_logs
        WHERE user_id = @user_id
        ORDER BY created_at DESC
      `);
    return res.json(result.recordset);
  } catch (err) {
    console.error('GET /log/mine error', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
