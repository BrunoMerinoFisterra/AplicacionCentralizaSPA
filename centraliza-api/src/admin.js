const express = require('express');
const bcrypt = require('bcryptjs');
const { getPool, sql } = require('./db');
const { requireAdmin } = require('./middleware');
const { getFinnegansAccessToken } = require('./finnegans');

const router = express.Router();

// ---------- Usuarios ----------

router.get('/users', requireAdmin, async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id, username, full_name, role, is_active,
             workflow_compra_codigo, workflow_compra_nombre,
             tipodoc_compra_codigo, tipodoc_compra_nombre,
             created_at
      FROM centraliza_users
      ORDER BY username
    `);
    return res.json({ users: result.recordset });
  } catch (err) {
    console.error('GET /admin/users error', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username y password son requeridos.' });
    }
    if (role && role !== 'admin' && role !== 'user') {
      return res.status(400).json({ error: 'role debe ser admin o user.' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const pool = await getPool();
    const result = await pool.request()
      .input('username',      sql.NVarChar, username.trim())
      .input('password_hash', sql.NVarChar, password_hash)
      .input('full_name',     sql.NVarChar, full_name || null)
      .input('role',          sql.NVarChar, role || 'user')
      .query(`
        INSERT INTO centraliza_users (username, password_hash, full_name, role)
        OUTPUT INSERTED.id
        VALUES (@username, @password_hash, @full_name, @role)
      `);
    return res.json({ ok: true, id: result.recordset[0].id });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese nombre.' });
    }
    console.error('POST /admin/users error', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Activar/desactivar, cambiar rol, resetear password
router.patch('/users/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'id inválido.' });

    const { is_active, role, password, full_name } = req.body;
    if (role !== undefined && role !== 'admin' && role !== 'user') {
      return res.status(400).json({ error: 'role debe ser admin o user.' });
    }
    // Evitar que un admin se desactive o se saque el rol a sí mismo
    if (id === req.userId && (is_active === false || (role !== undefined && role !== 'admin'))) {
      return res.status(400).json({ error: 'No podés desactivar ni quitar el rol a tu propia cuenta.' });
    }

    const sets = [];
    const request = (await getPool()).request().input('id', sql.Int, id);
    if (is_active !== undefined) {
      sets.push('is_active = @is_active');
      request.input('is_active', sql.Bit, is_active ? 1 : 0);
    }
    if (role !== undefined) {
      sets.push('role = @role');
      request.input('role', sql.NVarChar, role);
    }
    if (full_name !== undefined) {
      sets.push('full_name = @full_name');
      request.input('full_name', sql.NVarChar, full_name || null);
    }
    if (password !== undefined && password !== '') {
      sets.push('password_hash = @password_hash');
      request.input('password_hash', sql.NVarChar, await bcrypt.hash(password, 10));
    }
    if (sets.length === 0) return res.status(400).json({ error: 'Nada para actualizar.' });

    const result = await request.query(`UPDATE centraliza_users SET ${sets.join(', ')} WHERE id = @id`);
    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /admin/users/:id error', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// ---------- Empresas asignadas ----------

router.get('/users/:id/companies', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'id inválido.' });
    const pool = await getPool();
    const result = await pool.request()
      .input('user_id', sql.Int, id)
      .query(`SELECT company_code FROM centraliza_user_companies WHERE user_id = @user_id`);
    return res.json({ codes: result.recordset.map((r) => r.company_code) });
  } catch (err) {
    console.error('GET /admin/users/:id/companies error', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Reemplaza el set completo de empresas del usuario (lista vacía = sin restricción)
router.post('/users/:id/companies', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'id inválido.' });
    const { codes } = req.body;
    if (!Array.isArray(codes)) return res.status(400).json({ error: 'codes debe ser un array.' });

    const pool = await getPool();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      await new sql.Request(tx)
        .input('user_id', sql.Int, id)
        .query(`DELETE FROM centraliza_user_companies WHERE user_id = @user_id`);
      for (const code of codes) {
        await new sql.Request(tx)
          .input('user_id', sql.Int, id)
          .input('company_code', sql.NVarChar, String(code))
          .query(`INSERT INTO centraliza_user_companies (user_id, company_code) VALUES (@user_id, @company_code)`);
      }
      await tx.commit();
    } catch (txErr) {
      await tx.rollback();
      throw txErr;
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('POST /admin/users/:id/companies error', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// ---------- Workflow / tipo de documento de compra ----------

router.post('/users/:id/workflow', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'id inválido.' });
    const { workflow_codigo, workflow_nombre, tipodoc_codigo, tipodoc_nombre } = req.body;

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('wf_codigo', sql.NVarChar, workflow_codigo || null)
      .input('wf_nombre', sql.NVarChar, workflow_nombre || null)
      .input('td_codigo', sql.NVarChar, tipodoc_codigo || null)
      .input('td_nombre', sql.NVarChar, tipodoc_nombre || null)
      .query(`
        UPDATE centraliza_users
        SET workflow_compra_codigo = @wf_codigo,
            workflow_compra_nombre = @wf_nombre,
            tipodoc_compra_codigo  = @td_codigo,
            tipodoc_compra_nombre  = @td_nombre
        WHERE id = @id
      `);
    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('POST /admin/users/:id/workflow error', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// ---------- Proxies a Finnegans para poblar selects del panel ----------

function extractRows(data) {
  return Array.isArray(data) ? data
    : Array.isArray(data?.data) ? data.data
    : Array.isArray(data?.rows) ? data.rows
    : Array.isArray(data?.result) ? data.result : [];
}

function toOptions(rows) {
  return rows
    .map((item) => ({
      label: item.nombre ?? item.Nombre ?? item.NOMBRE ?? item.descripcion ?? item.Descripcion ?? item.codigo ?? item.Codigo ?? item.CODIGO ?? '',
      value: item.codigo ?? item.Codigo ?? item.CODIGO ?? '',
    }))
    .filter((o) => o.label && o.value)
    .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
}

async function finnegansProxy(res, path, mapFn) {
  try {
    const token = await getFinnegansAccessToken();
    const apiRes = await fetch(`https://api.finneg.com/api/${path}?ACCESS_TOKEN=${token}`);
    if (!apiRes.ok) return res.status(502).json({ error: 'Error al consultar Finnegans.' });
    const data = await apiRes.json();
    return res.json(mapFn(extractRows(data)));
  } catch (err) {
    console.error(`GET finnegans proxy ${path} error`, err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

router.get('/finnegans-workflows', requireAdmin, (_req, res) =>
  finnegansProxy(res, 'WorkflowEntidadAPI/list', (rows) => ({ workflows: toOptions(rows) }))
);

router.get('/finnegans-tipos-documento', requireAdmin, (_req, res) =>
  finnegansProxy(res, 'TipoDocumentoAPI/list', (rows) => ({ tipos: toOptions(rows) }))
);

router.get('/finnegans-companies', requireAdmin, (_req, res) =>
  finnegansProxy(res, 'empresaSucursal/list', (rows) => ({
    companies: rows
      .filter((item) => {
        const a = item.activo ?? item.ACTIVO;
        return a === true || a === 'true' || a === 1 || a === '1';
      })
      .map((item) => ({
        label: item.nombre ?? item.NOMBRE ?? item.establecimiento ?? item.Establecimiento ?? item.descripcion ?? item.Descripcion ?? item.codigo ?? item.CODIGO ?? '',
        value: item.codigo ?? item.CODIGO ?? item.empresaCodigo ?? item.EmpresaCodigo ?? item.establecimientoCodigo ?? item.EstablecimientoCodigo ?? item.value ?? '',
      }))
      .filter((c) => c.label && c.value)
      .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })),
  }))
);

// ---------- Logs ----------

router.get('/logs', requireAdmin, async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 200 id, user_id, username, form_type, company_label, status, error_detail, created_at
      FROM centraliza_logs
      ORDER BY created_at DESC
    `);
    return res.json({ logs: result.recordset });
  } catch (err) {
    console.error('GET /admin/logs error', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
