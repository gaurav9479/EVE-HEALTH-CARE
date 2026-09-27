const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  attempts: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['PENDING', 'FAILED_PERMANENT'], default: 'PENDING' },
});

module.exports = mongoose.model('WebhookRetry', schema);
