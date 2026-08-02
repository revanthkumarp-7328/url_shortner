const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../shared/config');
const db = require('../../shared/database/db');
const redis = require('../../shared/database/redis');
const { generateRandomCode } = require('../../shared/utils/base62');

const app = express();
app.use(cors());
app.use(express.json());

// Helper middleware to authenticate via JWT or API Key (sk_live_*)
async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token or API key required' });
  }

  const token = authHeader.split(' ')[1];

  // 1. Authenticate via API Key (sk_live_...)
  if (token.startsWith('sk_live_')) {
    try {
      const result = await db.query('SELECT id, email FROM users WHERE api_key = $1', [token]);
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid API Key' });
      }
      req.user = { userId: result.rows[0].id, email: result.rows[0].email };
      return next();
    } catch (err) {
      return res.status(500).json({ error: 'Failed to authenticate API Key' });
    }
  }

  // 2. Authenticate via JWT Token
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Health Check
app.get('/health', (req, res) => {
  res.json({ service: 'URL Service', status: 'UP', timestamp: new Date() });
});

// Create Short URL
app.post('/', authenticateUser, async (req, res) => {
  try {
    const { originalUrl, customAlias, password, expiresAt } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: 'Original URL is required' });
    }

    // Validate URL format
    try {
      new URL(originalUrl);
    } catch (_) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    let shortCode = (customAlias && customAlias.trim() !== '') ? customAlias.trim() : null;

    if (shortCode) {
      // Check custom alias availability
      const existing = await db.query('SELECT id FROM urls WHERE short_code = $1', [shortCode]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Custom alias is already taken' });
      }
    } else {
      // Generate collision-safe random code
      let attempts = 0;
      while (!shortCode && attempts < 5) {
        const candidate = generateRandomCode(6);
        const existing = await db.query('SELECT id FROM urls WHERE short_code = $1', [candidate]);
        if (existing.rows.length === 0) {
          shortCode = candidate;
        }
        attempts++;
      }
    }

    if (!shortCode) {
      return res.status(500).json({ error: 'Failed to generate unique short code' });
    }

    const passwordHash = (password && password.trim() !== '') ? await bcrypt.hash(password, 10) : null;
    
    // Validate expiresAt date (Optional)
    let expiryDate = null;
    if (expiresAt && expiresAt.trim() !== '' && !isNaN(new Date(expiresAt).getTime())) {
      expiryDate = new Date(expiresAt);
    }

    const result = await db.query(
      `INSERT INTO urls (user_id, original_url, short_code, custom_alias, password_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, original_url, short_code, custom_alias, expires_at, is_active, created_at`,
      [req.user.userId, originalUrl, shortCode, customAlias || null, passwordHash, expiryDate]
    );

    const urlRecord = result.rows[0];

    // Pre-populate Redis Cache for instant redirection
    const cacheData = {
      id: urlRecord.id,
      originalUrl: urlRecord.original_url,
      hasPassword: !!passwordHash,
      passwordHash: passwordHash || '',
      expiresAt: urlRecord.expires_at ? new Date(urlRecord.expires_at).toISOString() : null,
      isActive: true,
    };

    await redis.set(`short:${shortCode}`, JSON.stringify(cacheData));

    res.status(201).json({
      message: 'Short URL created successfully',
      url: {
        id: urlRecord.id,
        originalUrl: urlRecord.original_url,
        shortCode: urlRecord.short_code,
        shortUrl: `${config.BASE_REDIRECT_URL}/${urlRecord.short_code}`,
        expiresAt: urlRecord.expires_at,
        isActive: urlRecord.is_active,
        createdAt: urlRecord.created_at,
      },
    });
  } catch (err) {
    console.error('[URL Service Create Error]', err);
    res.status(500).json({ error: 'Failed to create short URL' });
  }
});

// List User Short URLs
app.get('/my-urls', authenticateUser, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.original_url, u.short_code, u.custom_alias, u.password_hash, u.expires_at, u.is_active, u.created_at,
              COUNT(c.id)::int as click_count
       FROM urls u
       LEFT JOIN clicks c ON u.id = c.url_id
       WHERE u.user_id = $1
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
      [req.user.userId]
    );

    const urls = result.rows.map((row) => ({
      id: row.id,
      originalUrl: row.original_url,
      shortCode: row.short_code,
      shortUrl: `${config.BASE_REDIRECT_URL}/${row.short_code}`,
      hasPassword: !!row.password_hash,
      expiresAt: row.expires_at,
      isActive: row.is_active,
      clicks: row.click_count,
      createdAt: row.created_at,
    }));

    res.json({ urls });
  } catch (err) {
    console.error('[URL Service List Error]', err);
    res.status(500).json({ error: 'Failed to fetch user URLs' });
  }
});

// Toggle URL Active Status
app.patch('/:id/toggle-active', authenticateUser, async (req, res) => {
  try {
    const urlId = req.params.id;
    const result = await db.query(
      'UPDATE urls SET is_active = NOT is_active WHERE id = $1 AND user_id = $2 RETURNING short_code, is_active, original_url, password_hash, expires_at',
      [urlId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'URL not found or unauthorized' });
    }

    const row = result.rows[0];

    // Invalidate/Update Redis cache
    const cacheData = {
      id: urlId,
      originalUrl: row.original_url,
      hasPassword: !!row.password_hash,
      passwordHash: row.password_hash || '',
      expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : '',
      isActive: row.is_active,
    };

    await redis.set(`short:${row.short_code}`, JSON.stringify(cacheData));

    res.json({ message: 'URL status updated', isActive: row.is_active });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle URL status' });
  }
});

// Delete Short URL
app.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const urlId = req.params.id;
    const result = await db.query('DELETE FROM urls WHERE id = $1 AND user_id = $2 RETURNING short_code', [
      urlId,
      req.user.userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'URL not found or unauthorized' });
    }

    const shortCode = result.rows[0].short_code;
    await redis.del(`short:${shortCode}`);

    res.json({ message: 'URL deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete URL' });
  }
});

const PORT = config.PORT.URL;
app.listen(PORT, () => {
  console.log(`[URL Microservice] Running on port ${PORT}`);
});
