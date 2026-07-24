// Corre un script SQL contra la base configurada en .env.
// Uso: node migrations/run-migration.js [archivo.sql]   (default: init.sql)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getPool } = require('../src/db');

async function main() {
  const file = process.argv[2] || 'init.sql';
  const fullPath = path.isAbsolute(file) ? file : path.join(__dirname, file);
  const script = fs.readFileSync(fullPath, 'utf8');

  const pool = await getPool();
  // Separar por GO (si lo hubiera) o ejecutar entero
  const batches = script.split(/^\s*GO\s*$/im).filter((b) => b.trim());
  for (const batch of batches) {
    await pool.request().batch(batch);
  }
  console.log(`Migración "${path.basename(fullPath)}" ejecutada correctamente.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
