// src/server.js
const http = require('http');
const app = require('./app');
const { connect } = require('./lib/mongoose');
const config = require('./config');

async function start() {
  try {
    await connect();
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }

  const server = http.createServer(app);
  server.listen(config.PORT, () => {
    console.log(`Server listening on port ${config.PORT}`);
  });
}

start();
