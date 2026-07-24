// Bootstrap de usuarios de Centraliza.
// Uso: node create-user.js <username> <password> [full_name] [role]
//   ej: node create-user.js admin MiClave123 "Administrador" admin
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getPool, sql } = require('./src/db');

async function main() {
  const [username, password, fullName, role] = process.argv.slice(2);
  if (!username || !password) {
    console.error('Uso: node create-user.js <username> <password> [full_name] [role]');
    process.exit(1);
  }
  if (role && role !== 'admin' && role !== 'user') {
    console.error('role debe ser "admin" o "user"');
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);
  const pool = await getPool();
  const result = await pool.request()
    .input('username',      sql.NVarChar, username.trim())
    .input('password_hash', sql.NVarChar, password_hash)
    .input('full_name',     sql.NVarChar, fullName || null)
    .input('role',          sql.NVarChar, role || 'user')
    .query(`
      INSERT INTO centraliza_users (username, password_hash, full_name, role)
      OUTPUT INSERTED.id
      VALUES (@username, @password_hash, @full_name, @role)
    `);

  console.log(`Usuario "${username}" creado con id ${result.recordset[0].id} (role: ${role || 'user'})`);
  process.exit(0);
}

main().catch((err) => {
  if (err.number === 2627 || err.number === 2601) {
    console.error(`Ya existe un usuario con ese nombre.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
