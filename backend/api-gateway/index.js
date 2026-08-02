const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const config = require('../shared/config');
const redis = require('../shared/database/redis');

const app = express();

app.use(helmet());
app.use(cors());

// Health Check
app.get('/health', (req, res) => {
  res.json({ service: 'API Gateway', status: 'UP', timestamp: new Date() });
});

// Global Redis-backed Rate Limiter (Max 100 requests per minute per IP)
const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:gateway:',
  }),
  message: { error: 'Too many requests from this IP, please try again after 1 minute.' },
});

app.use(globalRateLimiter);

// JWT Middleware for Protected Routes
function verifyJwtGateway(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.headers['x-user-id'] = String(decoded.userId);
    req.headers['x-user-email'] = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// 1. Proxy Route: Auth Service
app.use(
  '/api/v1/auth',
  createProxyMiddleware({
    target: `http://${config.HOST.AUTH}:${config.PORT.AUTH}`,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/auth': '' },
  })
);

// 2. Proxy Route: URL Service
app.use(
  '/api/v1/urls',
  createProxyMiddleware({
    target: `http://${config.HOST.URL}:${config.PORT.URL}`,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/urls': '' },
  })
);

// 3. Proxy Route: Analytics Service
app.use(
  '/api/v1/analytics',
  createProxyMiddleware({
    target: `http://${config.HOST.ANALYTICS}:${config.PORT.ANALYTICS}`,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/analytics': '' },
  })
);

const PORT = config.PORT.GATEWAY;
app.listen(PORT, () => {
  console.log(`[Express API Gateway] Running on port ${PORT}`);
});
