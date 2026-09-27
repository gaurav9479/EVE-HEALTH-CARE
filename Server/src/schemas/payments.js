// src/schemas/payments.js
const mongoose = require('mongoose');

// Simulated payment creation (client initiates)
const createPaymentSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, required: true },
    outcome: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
  },
  { _id: false, strict: true }
);

// Webhook event payload validation
const webhookSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, trim: true },
    providerRef: { type: String, required: true, trim: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
      validate: {
        validator: v => /^\d+(\.\d{1,2})?$/.test(v.toString()),
        message: 'Amount must have at most two decimals',
      },
    },
  },
  { _id: false, strict: true }
);

module.exports = { createPaymentSchema, webhookSchema };
