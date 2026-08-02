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
app.get('/health', (req, res) => {
  res.json({ service: 'Redirect Service', status: 'UP', timestamp: new Date() });
});

// Helper to push async click event to Redis Stream
async function logClickAsync(req, urlId) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const referrer = req.headers['referer'] || req.headers['referrer'] || 'Direct';

    await redis.xadd(
      config.CLICK_STREAM_KEY,
      '*',
      'urlId', String(urlId),
      'ip', String(ip),
      'userAgent', String(userAgent),
      'referrer', String(referrer),
      'timestamp', String(Date.now())
    );
  } catch (err) {
    console.error('[Redirect Service] Failed to queue async click log:', err.message);
  }
}

// Helper to check if expiration date has passed
function isExpired(expiresAt) {
  if (!expiresAt) return false;
  const expDate = new Date(expiresAt);
  if (isNaN(expDate.getTime())) return false;
  return expDate.getTime() <= Date.now();
}

// Perform URL Lookup from Cache or DB
async function getUrlRecord(shortCode) {
  const cached = await redis.get(`short:${shortCode}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fallback to PostgreSQL
  const result = await db.query(
    'SELECT id, original_url, password_hash, expires_at, is_active FROM urls WHERE short_code = $1',
    [shortCode]
  );

  if (result.rows.length === 0) return null;

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

// HTML Generator for Password Protection Screen
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
            transition: all 0.2s;
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
            transition: transform 0.2s, box-shadow 0.2s;
          }
          button:hover { transform: translateY(-2px); box-shadow: 0 0 25px rgba(99, 102, 241, 0.4); }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🔒</div>
          <h2>Password Protected Link</h2>
          <p>This link is encrypted. Enter the password set by the owner to unlock access.</p>
          ${error ? `<div class="error">${error}</div>` : ''}
          <form method="POST" action="/${code}">
            <input type="password" name="password" placeholder="Enter link password..." required autofocus />
            <button type="submit">Unlock & Access Link ➔</button>
          </form>
        </div>
      </body>
    </html>
  `;
}

// HTML Generator for Expired Screen
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
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
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

// Redirect Endpoint (GET)
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
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

    // Check if link expiration date has passed
    if (isExpired(record.expiresAt)) {
      return res.status(410).send(renderExpiredPage());
    }

    // Check if Password Protected -> Render Glassmorphism Password Screen
    if (record.hasPassword) {
      return res.send(renderPasswordPage(code));
    }

    // Fire & Forget Async Click Event
    logClickAsync(req, record.id);

    // High-speed HTTP 302 Redirect
    return res.redirect(302, record.originalUrl);
  } catch (err) {
    console.error('[Redirect Service Error]', err);
    res.status(500).send('Internal Server Error');
  }
});

// Password Submission Endpoint (POST /:code)
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

    // Log Click Async
    logClickAsync(req, record.id);

    // Redirect to original URL on successful password verification
    return res.redirect(302, record.originalUrl);
  } catch (err) {
    console.error('[Redirect Service Password Verification Error]', err);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = config.PORT.REDIRECT;
app.listen(PORT, () => {
  console.log(`[Redirect Microservice Engine] Running on port ${PORT}`);
});
