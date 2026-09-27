// src/lib/mongoose.js
const mongoose = require('mongoose');
const config = require('../config');

function connect() {
  return mongoose.connect(config.MONGODB_URI, {
    // useNewUrlParser and useUnifiedTopology are defaults in newer mongoose
  });
}

module.exports = { connect };
