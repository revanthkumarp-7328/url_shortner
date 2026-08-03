require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: {
    GATEWAY: process.env.PORT_GATEWAY || 5000,
    AUTH: process.env.PORT_AUTH || 5001,
    URL: process.env.PORT_URL || 5002,
    REDIRECT: process.env.PORT_REDIRECT || 5003,
    ANALYTICS: process.env.PORT_ANALYTICS || 5004,
  },
  HOST: {
    AUTH: process.env.SERVICE_AUTH_HOST || 'auth-service',
    URL: process.env.SERVICE_URL_HOST || 'url-service',
    REDIRECT: process.env.SERVICE_REDIRECT_HOST || 'redirect-service',
    ANALYTICS: process.env.SERVICE_ANALYTICS_HOST || 'analytics-service',
  },
  PG: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'shortener_user',
    password: process.env.POSTGRES_PASSWORD || 'shortener_secret',
    database: process.env.POSTGRES_DB || 'shortener_db',
  },
  REDIS: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
  },
  JWT_SECRET: process.env.JWT_SECRET || 'ProductionJwtSecretKeyZipUrl2026!',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  BASE_REDIRECT_URL: process.env.BASE_REDIRECT_URL || 'http://localhost:5003',
  CLICK_STREAM_KEY: 'stream:click_events',
};
