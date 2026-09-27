// src/schemas/centres.js
const mongoose = require('mongoose');

// Create centre request schema
const createCentreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
  },
  { _id: false, strict: true }
);

// Patch centre – at least one of name, location, isActive
const patchCentreSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    location: { type: String, trim: true },
    isActive: { type: Boolean },
  },
  { _id: false, strict: true }
);

module.exports = { createCentreSchema, patchCentreSchema };
