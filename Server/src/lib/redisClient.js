// src/lib/redisClient.js

const Redis = require('ioredis');

// Use REDIS_URL env var or default to localhost
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const client = new Redis(redisUrl);

client.on('error', (err) => {
  console.error('Redis error:', err);
});

module.exports = client;
