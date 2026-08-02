const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigrations() {
  console.log('[Migration Runner] Starting database schema migrations...');

  try {
    // 1. Create migration tracking table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Read all SQL migration files in migrations directory
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    // 3. Check already executed migrations
    const res = await db.query('SELECT filename FROM schema_migrations');
    const executedFiles = new Set(res.rows.map((r) => r.filename));

    for (const file of files) {
      if (!executedFiles.has(file)) {
        console.log(`[Migration Runner] Executing migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

        await db.query('BEGIN');
        await db.query(sql);
        await db.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await db.query('COMMIT');

        console.log(`[Migration Runner] Successfully applied migration: ${file}`);
      } else {
        console.log(`[Migration Runner] Skipping already executed migration: ${file}`);
      }
    }

    console.log('[Migration Runner] All migrations applied successfully!');
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    console.error('[Migration Runner Fatal Error]', err);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
