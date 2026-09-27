// src/modules/auth/service.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const User = require('../../models/User.model');

const SALT_ROUNDS = 10;

async function signup({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    err.code = 'DUPLICATE_ERROR';
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role: 'USER' });
  const token = jwt.sign({ sub: user._id.toString(), role: user.role }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
  // Convert to plain object without passwordHash via toJSON transform
  const userObj = user.toJSON();
  return { user: userObj, accessToken: token };
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  // For security, use same error for unknown email or bad password
  const genericErr = new Error('Invalid email or password');
  genericErr.status = 401;
  genericErr.code = 'UNAUTHORIZED';

  if (!user) {
    throw genericErr;
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw genericErr;
  }
  const token = jwt.sign({ sub: user._id.toString(), role: user.role }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
  return { accessToken: token, user: user.toJSON() };
}

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return user.toJSON();
}

module.exports = { signup, login, getMe };
