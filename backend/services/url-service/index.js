const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const config = require('../../shared/config');
const db = require('../../shared/database/db');
const redis = require('../../shared/database/redis');
const { generateRandomCode } = require('../../shared/utils/base62');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

// Health Check
app.get(['/health', '/api/v1/health'], (req, res) => {
  res.json({ service: 'URL Service (Shortening Engine)', status: 'UP', timestamp: new Date() });
});

// Create Short URL Endpoint (Public Standalone Microservice)
app.post(['/', '/api/v1', '/api/v1/urls'], async (req, res) => {
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
      // Unique constraint as sole collision arbiter
      const existing = await db.query('SELECT id FROM urls WHERE short_code = $1 OR custom_alias = $1', [shortCode]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Custom alias is already taken' });
      }
    } else {
      // Generate collision-safe Base62 code
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
    
    let expiryDate = null;
    if (expiresAt && expiresAt.trim() !== '' && !isNaN(new Date(expiresAt).getTime())) {
      expiryDate = new Date(expiresAt);
    }

    const result = await db.query(
      `INSERT INTO urls (original_url, short_code, custom_alias, password_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, original_url, short_code, custom_alias, expires_at, is_active, created_at`,
      [originalUrl, shortCode, customAlias || null, passwordHash, expiryDate]
    );

    const urlRecord = result.rows[0];

    // Pre-populate Redis Cache-Aside for sub-15ms redirection path
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

// List All Active Short URLs
app.get(['/all', '/api/v1/all', '/api/v1/urls/all'], async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, original_url, short_code, custom_alias, password_hash, expires_at, is_active, created_at
       FROM urls
       ORDER BY created_at DESC
       LIMIT 100`
    );

    const urls = result.rows.map((row) => ({
      id: row.id,
      originalUrl: row.original_url,
      shortCode: row.short_code,
      shortUrl: `${config.BASE_REDIRECT_URL}/${row.short_code}`,
      hasPassword: !!row.password_hash,
      expiresAt: row.expires_at,
      isActive: row.is_active,
      createdAt: row.created_at,
    }));

    res.json({ urls });
  } catch (err) {
    console.error('[URL Service List Error]', err);
    res.status(500).json({ error: 'Failed to fetch URLs' });
  }
});

// Toggle URL Active Status
app.patch(['/:id/toggle-active', '/api/v1/:id/toggle-active', '/api/v1/urls/:id/toggle-active'], async (req, res) => {
  try {
    const urlId = req.params.id;
    const result = await db.query(
      'UPDATE urls SET is_active = NOT is_active WHERE id = $1 RETURNING short_code, is_active, original_url, password_hash, expires_at',
      [urlId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const row = result.rows[0];

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
app.delete(['/:id', '/api/v1/:id', '/api/v1/urls/:id'], async (req, res) => {
  try {
    const urlId = req.params.id;
    const result = await db.query('DELETE FROM urls WHERE id = $1 RETURNING short_code', [urlId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'URL not found' });
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
  console.log(`[URL Microservice] Shortening Engine running on port ${PORT}`);
});
