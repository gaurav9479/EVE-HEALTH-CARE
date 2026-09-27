// src/config/index.js
require('dotenv').config();

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

module.exports = {
  PORT: requiredEnv('PORT'),
  MONGODB_URI: requiredEnv('MONGODB_URI'),
  JWT_SECRET: requiredEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: requiredEnv('JWT_EXPIRES_IN'),
  WEBHOOK_SECRET: requiredEnv('WEBHOOK_SECRET'),
};
