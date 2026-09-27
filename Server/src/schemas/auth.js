// src/schemas/auth.js
const mongoose = require('mongoose');

// Signup schema: name, email, password (min 8 chars)
const signupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
  },
  { _id: false, strict: true }
);

// Login schema: email, password
const loginSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
  },
  { _id: false, strict: true }
);

module.exports = { signupSchema, loginSchema };
