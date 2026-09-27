
const express = require('express');
const validate = require('../middleware/validate.middleware');
const { signupSchema, loginSchema } = require('../schemas/auth');
const { signup, login, getMe } = require('../modules/auth/authservice');
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (req, res) => res.status(429).json({ error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, try again later.', details: [] } })
});

const router = express.Router();


router.post('/signup', authLimiter, validate(signupSchema), async (req, res, next) => {
  try {
    const result = await signup(req.validated);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});


router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const result = await login(req.validated);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});


router.get('/me', async (req, res, next) => {
  try {
    const user = await getMe(req.user.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
