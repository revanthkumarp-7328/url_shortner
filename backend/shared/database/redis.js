const Redis = require('ioredis');
const config = require('../config');

const redis = new Redis({
  host: config.REDIS.host,
  port: config.REDIS.port,
  password: config.REDIS.password,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => {
  console.log('[Redis Client] Connected to Redis instance');
});

redis.on('error', (err) => {
  console.error('[Redis Error]', err.message);
});

module.exports = redis;
