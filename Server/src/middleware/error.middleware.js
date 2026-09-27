// src/middleware/error.js
/**
 * Centralized error handling middleware.
 * Maps known error types to appropriate HTTP status codes and JSON bodies.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);

  // Validation errors from lib/parse.js have name 'VALIDATION_ERROR'
  if (err.name === 'VALIDATION_ERROR') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.message, details: err.details || [] },
    });
  }

  // Mongoose validation errors (e.g., schema validation) also map to 400
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details },
    });
  }

  // Mongoose CastError (invalid ObjectId format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid identifier format' },
    });
  }

  // Duplicate key error from MongoDB
  if (err.code === 11000) {
    // If the error has already been handled (e.g., in service) we may want a custom code, but default to 409
    return res.status(409).json({
      error: { code: 'DUPLICATE_ERROR', message: 'Duplicate resource', details: [] },
    });
  }

  // Default – internal server error without exposing stack trace
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
}

module.exports = errorHandler;
