// src/modules/payments/service.js
const mongoose = require('mongoose');
const Payment = require('../../models/Payment.model');
const Booking = require('../../models/Booking.model');
const WebhookEvent = require('../../models/WebhookEvent.model');
const { toPaise } = require('../../lib/money');

async function applyPaymentEvent({ eventId, providerRef, bookingId, status, amount }) {

  let webhook;
  try {
    webhook = await WebhookEvent.create({
      eventId,
      providerRef,
      bookingId,
      status,
      payload: { amount },
    });
    // New event inserted
    webhook.processingResult = 'APPLIED';
  } catch (e) {
    if (e.code === 11000) {

      return { processingResult: 'DUPLICATE', booking: null, payment: null };
    }
    throw e;
  }


  const booking = await Booking.findById(bookingId);
  if (!booking) {
    webhook.processingResult = 'REJECTED';
    await webhook.save();
    return { processingResult: 'REJECTED', booking: null, payment: null };
  }
  const amountPaise = toPaise(amount.toString());
  if (booking.amountPaise !== amountPaise) {
    webhook.processingResult = 'REJECTED';
    await webhook.save();
    return { processingResult: 'REJECTED', booking, payment: null };
  }


  let payment;
  try {
    payment = await Payment.create({
      bookingId,
      amountPaise,
      status: 'PENDING',
      providerRef,
    });
  } catch (e) {
    if (e.code === 11000) {

      payment = await Payment.findOneAndUpdate({ providerRef }, { $set: { status } }, { new: true });
    } else {
      throw e;
    }
  }


  if (payment.status !== status) {
    payment.status = status;
    await payment.save();
  }


  if (status === 'SUCCESS') {
    const updated = await Booking.findOneAndUpdate(
      { _id: bookingId, status: 'PENDING' },
      { $set: { status: 'CONFIRMED' } },
      { new: true }
    );
    if (updated) {
      webhook.processingResult = 'APPLIED';
      await webhook.save();
      return { processingResult: 'APPLIED', booking: updated, payment };
    }

    webhook.processingResult = 'IGNORED';
    await webhook.save();
    return { processingResult: 'IGNORED', booking, payment };
  } else if (status === 'FAILED') {
    const updated = await Booking.findOneAndUpdate(
      { _id: bookingId, status: 'PENDING' },
      { $set: { status: 'FAILED' } },
      { new: true }
    );
    if (updated) {
      webhook.processingResult = 'APPLIED';
      await webhook.save();
      return { processingResult: 'APPLIED', booking: updated, payment };
    }
    webhook.processingResult = 'IGNORED';
    await webhook.save();
    return { processingResult: 'IGNORED', booking, payment };
  }
  // Should not reach here
  webhook.processingResult = 'REJECTED';
  await webhook.save();
  return { processingResult: 'REJECTED', booking, payment };
}


async function simulatePayment({ bookingId, outcome }) {

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  const providerRef = `sim_${new mongoose.Types.ObjectId()}_${outcome}`; // deterministic for demo
  const amount = (booking.amountPaise / 100).toFixed(2);
  const eventId = `sim_${bookingId}_${outcome}`; // unique per booking/outcome

  const result = await applyPaymentEvent({ eventId, providerRef, bookingId, status: outcome, amount });

  return result;
}


async function getPayment(requesterId, isAdmin, paymentId) {
  const payment = await Payment.findById(paymentId).lean();
  if (!payment) {
    const err = new Error('Payment not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (!isAdmin) {

    const booking = await Booking.findById(payment.bookingId);
    if (!booking || booking.userId.toString() !== requesterId) {
      const err = new Error('Payment not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
  }
  return payment;
}

module.exports = { applyPaymentEvent, simulatePayment, getPayment };
