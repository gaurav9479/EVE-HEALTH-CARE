// src/middleware/validate.js
const { parse } = require('../lib/parse');

/**
 * Middleware factory that validates request bodies against a Mongoose schema.
 * The schema must be defined with `{ _id: false }` because it is not a model.
 * On success, `req.validated` contains the casted payload.
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      const validated = parse(schema, req.body);
      req.validated = validated;
      next();
    } catch (err) {
      // Expected validation error from parse.js
      if (err.name === 'VALIDATION_ERROR') {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: err.message, details: err.details },
        });
      }
      // Unexpected – forward to error handler
      next(err);
    }
  };
}

module.exports = validate;
