
const express = require('express');
const validate = require('../middleware/validate.middleware');
const { createPaymentSchema, webhookSchema } = require('../schemas/payments');
const paymentService = require('../modules/payments/payment.service');
const { toRupeeString } = require('../lib/money');
const crypto = require('crypto');
const config = require('../config');

const router = express.Router();


router.post('/', validate(createPaymentSchema), async (req, res, next) => {
  try {
    const { bookingId, outcome } = req.validated;

    const booking = await require('../models/Booking.model').findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    if (booking.userId.toString() !== req.user.id) {
      const err = new Error('Booking not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    if (booking.status !== 'PENDING') {
      const err = new Error('Booking not in PENDING state');
      err.status = 409;
      err.code = 'INVALID_STATE';
      throw err;
    }

    const result = await paymentService.simulatePayment({ bookingId, outcome });

    const payment = result.payment.toObject();
    payment.amountPaise = toRupeeString(payment.amountPaise);
    const bookingResp = result.booking ? result.booking.toObject() : null;
    if (bookingResp) {
      bookingResp.amountPaise = toRupeeString(bookingResp.amountPaise);
    }
    res.json({ payment, booking: bookingResp, processingResult: result.processingResult });
  } catch (err) {
    next(err);
  }
});


router.get('/:id', async (req, res, next) => {
  try {
    const payment = await paymentService.getPayment(req.user.id, req.user.role === 'ADMIN', req.params.id);
    const resp = payment.toObject();
    resp.amountPaise = toRupeeString(resp.amountPaise);
    res.json({ payment: resp });
  } catch (err) {
    next(err);
  }
});


router.post('/webhook', validate(webhookSchema), async (req, res, next) => {
  try {
    const receivedSecret = req.headers['x-webhook-secret'];
    if (!receivedSecret) {
      const err = new Error('Missing webhook secret');
      err.status = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }
    const expected = Buffer.from(config.WEBHOOK_SECRET);
    const received = Buffer.from(receivedSecret);
    const len = Math.max(expected.length, received.length);
    const paddedExpected = Buffer.alloc(len);
    const paddedReceived = Buffer.alloc(len);
    expected.copy(paddedExpected);
    received.copy(paddedReceived);
    if (!crypto.timingSafeEqual(paddedExpected, paddedReceived)) {
      const err = new Error('Invalid webhook secret');
      err.status = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }
    const { eventId, providerRef, bookingId, status, amount } = req.validated;
    const result = await paymentService.applyPaymentEvent({ eventId, providerRef, bookingId, status, amount });
    res.json({ ok: true, result: result.processingResult });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
