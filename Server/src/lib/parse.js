// src/lib/parse.js
const mongoose = require('mongoose');

/**
 * Validate and cast a payload against a Mongoose schema that is NOT a model.
 * The schema should be defined with `{ _id: false }` because it represents a request body.
 *
 * @param {mongoose.Schema} schema - The Mongoose schema for the request body.
 * @param {Object} payload - The raw request payload.
 * @returns {Object} - The casted document (plain object).
 * @throws {Error} - Throws an error with name 'VALIDATION_ERROR' and a `details` array when validation fails.
 */
function parse(schema, payload) {
  // Create a disposable document (no model) for validation only
  const doc = new mongoose.Document(payload, schema);
  const err = doc.validateSync();
  if (err) {
    const messages = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
    const validationError = new Error('Validation failed');
    validationError.name = 'VALIDATION_ERROR';
    validationError.details = messages;
    throw validationError;
  }
  // Return plain object (doc.toObject()) after casting defaults etc.
  return doc.toObject();
}

module.exports = { parse };
