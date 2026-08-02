const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool(config.PG);

pool.on('connect', () => {
  console.log('[PostgreSQL Pool] Connected to database');
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
