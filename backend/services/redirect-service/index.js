const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const config = require('../../shared/config');
const db = require('../../shared/database/db');
const redis = require('../../shared/database/redis');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get(['/health', '/api/v1/health'], (req, res) => {
  res.json({ service: 'Redirect Service (High Throughput Engine)', status: 'UP', timestamp: new Date() });
});

// Helper to check if expiration date has passed
function isExpired(expiresAt) {
  if (!expiresAt) return false;
  const expDate = new Date(expiresAt);
  if (isNaN(expDate.getTime())) return false;
  return expDate.getTime() <= Date.now();
}

// Perform URL Lookup from Redis Cache-Aside with Sentinel Negative Caching (5-min TTL)
async function getUrlRecord(shortCode) {
  if (!shortCode) return null;

  // 1. Sentinel Negative Cache check to absorb bot probes
  const isInvalid = await redis.get(`short:invalid:${shortCode}`);
  if (isInvalid) {
    return null;
  }

  // 2. Cache-Aside lookup
  const cached = await redis.get(`short:${shortCode}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // 3. PostgreSQL Fallback (Case-insensitive match for maximum resilience)
  const result = await db.query(
    'SELECT id, original_url, password_hash, expires_at, is_active FROM urls WHERE short_code = $1 OR custom_alias = $1 OR LOWER(short_code) = LOWER($1) OR LOWER(custom_alias) = LOWER($1)',
    [shortCode]
  );

  if (result.rows.length === 0) {
    // Set 5-minute Sentinel Negative Cache to absorb repeated bot probing
    await redis.set(`short:invalid:${shortCode}`, '1', 'EX', 300);
    return null;
  }

  const row = result.rows[0];
  const cacheData = {
    id: row.id,
    originalUrl: row.original_url,
    hasPassword: !!row.password_hash,
    passwordHash: row.password_hash || '',
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    isActive: row.is_active,
  };

  // Cache for 24 hours
  await redis.set(`short:${shortCode}`, JSON.stringify(cacheData), 'EX', 86400);
  return cacheData;
}

// Glassmorphism HTML Generator for Password Protection Screen
function renderPasswordPage(code, error = null) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Protected Link - Password Required</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
          body {
            background: #090d16;
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background-image: 
              radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
              radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.15) 0%, transparent 40%);
          }
          .card {
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 36px;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
            text-align: center;
          }
          .icon {
            width: 56px;
            height: 56px;
            background: rgba(99, 102, 241, 0.15);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: #818cf8;
            font-size: 24px;
          }
          h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; }
          p { color: #94a3b8; font-size: 0.9rem; margin-bottom: 24px; }
          .error {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            padding: 10px;
            border-radius: 8px;
            font-size: 0.85rem;
            margin-bottom: 20px;
          }
          input {
            width: 100%;
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #f8fafc;
            padding: 14px 16px;
            border-radius: 10px;
            font-size: 1rem;
            margin-bottom: 20px;
            outline: none;
          }
          input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); }
          button {
            width: 100%;
            background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
            color: #ffffff;
            border: none;
            padding: 14px;
            font-size: 1rem;
            font-weight: 600;
            border-radius: 10px;
            cursor: pointer;
          }
          button:hover { transform: translateY(-2px); box-shadow: 0 0 25px rgba(99, 102, 241, 0.4); }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🔒</div>
          <h2>Password Protected Link</h2>
          <p>This link is encrypted. Enter the password set by the creator to unlock access.</p>
          ${error ? `<div class="error">${error}</div>` : ''}
          <form method="POST" action="/${code}">
            <input type="password" name="password" placeholder="Enter link password..." required autoFocus />
            <button type="submit">Unlock & Access Link ➔</button>
          </form>
        </div>
      </body>
    </html>
  `;
}

// HTML Generator for Expired Link Screen
function renderExpiredPage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>410 - Link Expired</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
          body {
            background: #090d16;
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .card {
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 16px;
            padding: 36px;
            width: 100%;
            max-width: 420px;
            text-align: center;
          }
          .icon { font-size: 40px; margin-bottom: 16px; }
          h2 { font-size: 1.5rem; font-weight: 700; color: #fca5a5; margin-bottom: 8px; }
          p { color: #94a3b8; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">⏳</div>
          <h2>Short Link Expired</h2>
          <p>This short link reached its set expiration date and is no longer accessible.</p>
        </div>
      </body>
    </html>
  `;
}

// Redirect Endpoint (GET /:code)
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    console.log(`[Redirect Request] Incoming code lookup: ${code}`);

    const record = await getUrlRecord(code);

    if (!record) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head><title>404 - Link Not Found</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f8fafc;">
            <h1>404 - Link Not Found</h1>
            <p>The short URL you clicked does not exist or has been deleted.</p>
          </body>
        </html>
      `);
    }

    if (!record.isActive) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
          <head><title>410 - Link Disabled</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f8fafc;">
            <h1>Link Disabled</h1>
            <p>This short URL has been deactivated by its owner.</p>
          </body>
        </html>
      `);
    }

    if (isExpired(record.expiresAt)) {
      return res.status(410).send(renderExpiredPage());
    }

    if (record.hasPassword) {
      return res.send(renderPasswordPage(code));
    }

    // Ultra-Fast Sub-15ms HTTP 302 Redirect
    console.log(`[Redirect Success] Redirecting code ${code} -> ${record.originalUrl}`);
    return res.redirect(302, record.originalUrl);
  } catch (err) {
    console.error('[Redirect Service Error]', err);
    res.status(500).send('Internal Server Error');
  }
});

// Password Verification Endpoint (POST /:code)
app.post('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { password } = req.body;

    const record = await getUrlRecord(code);
    if (!record || !record.hasPassword) {
      return res.status(400).send(renderPasswordPage(code, 'Invalid request or link is not password protected.'));
    }

    if (isExpired(record.expiresAt)) {
      return res.status(410).send(renderExpiredPage());
    }

    const valid = await bcrypt.compare(password || '', record.passwordHash);
    if (!valid) {
      return res.status(401).send(renderPasswordPage(code, 'Incorrect password. Please try again.'));
    }

    return res.redirect(302, record.originalUrl);
  } catch (err) {
    console.error('[Redirect Service Password Error]', err);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = config.PORT.REDIRECT;
app.listen(PORT, () => {
  console.log(`[Redirect Microservice Engine] Running on port ${PORT}`);
});
