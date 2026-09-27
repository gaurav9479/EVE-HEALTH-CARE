// src/schemas/offerings.js
const mongoose = require('mongoose');

// Add offering schema (POST /api/centres/:id/tests)
// name (global test name, case‑insensitive), optional description, price (positive number, max 2 decimals)
const addOfferingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: {
      type: Number,
      required: true,
      min: 0.01,
      validate: {
        validator: v => /^\d+(\.\d{1,2})?$/.test(v.toString()),
        message: 'Price must have at most two decimal places',
      },
    },
  },
  { _id: false, strict: true }
);

// Patch offering schema (price and/or isAvailable)
const patchOfferingSchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      min: 0.01,
      validate: {
        validator: v => /^\d+(\.\d{1,2})?$/.test(v.toString()),
        message: 'Price must have at most two decimal places',
      },
    },
    isAvailable: { type: Boolean },
  },
  { _id: false, strict: true }
);

module.exports = { addOfferingSchema, patchOfferingSchema };
