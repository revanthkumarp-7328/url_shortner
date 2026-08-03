const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const config = require('../../shared/config');
const db = require('../../shared/database/db');
const redis = require('../../shared/database/redis');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

// Middleware: Authenticate User via JWT or API Key (sk_live_*)
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
  res.json({ service: 'Analytics Service', status: 'UP', timestamp: new Date() });
});

// Redis Stream Background Consumer Worker
async function startAnalyticsWorker() {
  const group = 'analytics_workers';
  const consumer = `consumer_${process.pid}`;

  try {
    // Create Consumer Group if it doesn't exist
    await redis.xgroup('CREATE', config.CLICK_STREAM_KEY, group, '0', 'MKSTREAM').catch(() => {});
    console.log('[Analytics Worker] Consumer group initialized. Listening for click stream events...');

    while (true) {
      try {
        const response = await redis.xreadgroup('GROUP', group, consumer, 'BLOCK', 2000, 'COUNT', 10, 'STREAMS', config.CLICK_STREAM_KEY, '>');
        if (response && response.length > 0) {
          const [streamKey, messages] = response[0];
          for (const message of messages) {
            const [msgId, fields] = message;
            const event = {};
            for (let i = 0; i < fields.length; i += 2) {
              event[fields[i]] = fields[i + 1];
            }

            // Parse Geo IP
            const rawIp = event.ip || '127.0.0.1';
            const cleanIp = rawIp.split(',')[0].trim();
            const isLocal = !cleanIp || cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp.startsWith('192.168.') || cleanIp.startsWith('10.');
            const geo = geoip.lookup(cleanIp) || {};
            const country = isLocal ? 'Local Dev' : (geo.country || 'Unknown');
            const city = isLocal ? 'Localhost' : (geo.city || 'Unknown');

            // Parse User Agent
            const parser = new UAParser(event.userAgent);
            const uaResult = parser.getResult();
            const browser = uaResult.browser.name || 'Unknown';
            const os = uaResult.os.name || 'Unknown';
            const device = uaResult.device.type || 'Desktop';

            // Persist to PostgreSQL database
            await db.query(
              `INSERT INTO clicks (url_id, ip_address, country, city, browser, os, device, referrer)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [event.urlId, cleanIp, country, city, browser, os, device, event.referrer]
            );

            // Acknowledge processed event
            await redis.xack(config.CLICK_STREAM_KEY, group, msgId);
          }
        }
      } catch (loopErr) {
        console.error('[Analytics Worker Loop Error]', loopErr.message);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } catch (err) {
    console.error('[Analytics Worker Setup Error]', err);
  }
}

// Start worker in background
startAnalyticsWorker();

// API Endpoint: Get Aggregated Dashboard Analytics
app.get('/dashboard-summary', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Total URLs & Total Clicks
    const totalsRes = await db.query(
      `SELECT COUNT(u.id)::int as total_urls, COALESCE(SUM(click_counts.count), 0)::int as total_clicks
       FROM urls u
       LEFT JOIN (
         SELECT url_id, COUNT(id) as count FROM clicks GROUP BY url_id
       ) click_counts ON u.id = click_counts.url_id
       WHERE u.user_id = $1`,
      [userId]
    );

    // Clicks per Day (Last 30 Days)
    const timeSeriesRes = await db.query(
      `SELECT DATE(c.clicked_at) as date, COUNT(c.id)::int as clicks
       FROM clicks c
       JOIN urls u ON c.url_id = u.id
       WHERE u.user_id = $1 AND c.clicked_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(c.clicked_at)
       ORDER BY date ASC`,
      [userId]
    );

    // Top Countries
    const countriesRes = await db.query(
      `SELECT c.country, COUNT(c.id)::int as clicks
       FROM clicks c
       JOIN urls u ON c.url_id = u.id
       WHERE u.user_id = $1
       GROUP BY c.country
       ORDER BY clicks DESC LIMIT 5`,
      [userId]
    );

    // Browsers
    const browsersRes = await db.query(
      `SELECT c.browser, COUNT(c.id)::int as clicks
       FROM clicks c
       JOIN urls u ON c.url_id = u.id
       WHERE u.user_id = $1
       GROUP BY c.browser
       ORDER BY clicks DESC LIMIT 5`,
      [userId]
    );

    // Referrers
    const referrersRes = await db.query(
      `SELECT c.referrer, COUNT(c.id)::int as clicks
       FROM clicks c
       JOIN urls u ON c.url_id = u.id
       WHERE u.user_id = $1
       GROUP BY c.referrer
       ORDER BY clicks DESC LIMIT 5`,
      [userId]
    );

    res.json({
      summary: totalsRes.rows[0] || { total_urls: 0, total_clicks: 0 },
      timeSeries: timeSeriesRes.rows,
      countries: countriesRes.rows,
      browsers: browsersRes.rows,
      referrers: referrersRes.rows,
    });
  } catch (err) {
    console.error('[Analytics Service Summary Error]', err);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// API Endpoint: Get Detailed Analytics for a Specific URL
app.get('/url/:id', authenticateUser, async (req, res) => {
  try {
    const urlId = req.params.id;
    const userId = req.user.userId;

    // Verify URL ownership
    const urlCheck = await db.query('SELECT id, short_code, original_url FROM urls WHERE id = $1 AND user_id = $2', [urlId, userId]);
    if (urlCheck.rows.length === 0) {
      return res.status(404).json({ error: 'URL not found or unauthorized' });
    }

    const clicksRes = await db.query(
      `SELECT ip_address, country, city, browser, os, device, referrer, clicked_at
       FROM clicks WHERE url_id = $1 ORDER BY clicked_at DESC LIMIT 100`,
      [urlId]
    );

    res.json({
      url: urlCheck.rows[0],
      recentClicks: clicksRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch URL analytics' });
  }
});

const PORT = config.PORT.ANALYTICS;
app.listen(PORT, () => {
  console.log(`[Analytics Microservice API] Running on port ${PORT}`);
});
