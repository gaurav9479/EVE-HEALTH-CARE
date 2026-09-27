// src/modules/bookings/service.js
const Booking = require('../../models/Booking.model');
const CentreTest = require('../../models/CentreTest.model');
const { toPaise } = require('../../lib/money');

async function createBooking(userId, { centreId, testId, appointmentAt }) {

  const centre = await require('../../models/DiagnosticCentre.model').findById(centreId);
  if (!centre || !centre.isActive) {
    const err = new Error('Centre not found or inactive');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }


  const offering = await CentreTest.findOne({ centreId, testId, isAvailable: true });
  if (!offering) {
    const err = new Error('Test not offered at this centre or unavailable');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const apptDate = new Date(appointmentAt);
  if (isNaN(apptDate.getTime())) {
    const err = new Error('Invalid appointment date');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  if (apptDate <= new Date()) {
    const err = new Error('Appointment must be in the future');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }


  const amountPaise = offering.pricePaise;


  try {
    const booking = await Booking.create({
      userId,
      centreId,
      testId,
      appointmentAt: apptDate,
      amountPaise,
      status: 'PENDING',
    });
    return booking;
  } catch (err) {
    // Duplicate key (unique partial index)
    if (err.code === 11000) {
      const dupErr = new Error('Duplicate active booking for this centre/test/appointment');
      dupErr.status = 409;
      dupErr.code = 'DUPLICATE_ERROR';
      throw dupErr;
    }
    throw err;
  }
}

/**
 * List bookings for the caller (user sees own, admin sees all)
 */
async function listBookings(userId, isAdmin, page = 1, limit = 20) {
  const filter = isAdmin ? {} : { userId };
  const skip = (page - 1) * limit;
  const bookings = await Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  const total = await Booking.countDocuments(filter);
  return { data: bookings, meta: { page, limit, total } };
}

/**
 * Get a single booking – owner or admin only.
 */
async function getBooking(requesterId, isAdmin, bookingId) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (!isAdmin && booking.userId.toString() !== requesterId) {
    const err = new Error('Booking not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return booking;
}

/**
 * Cancel a booking – allowed from PENDING or CONFIRMED if appointment still in future.
 * Idempotent: if already CANCELLED, return the booking unchanged.
 */
async function cancelBooking(requesterId, isAdmin, bookingId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (!isAdmin && booking.userId.toString() !== requesterId) {
    const err = new Error('Booking not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // If already cancelled return as is (idempotent)
  if (booking.status === 'CANCELLED') {
    return booking;
  }

  // Only allow cancellation from PENDING or CONFIRMED and future appointment
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    const err = new Error('Cannot cancel a terminal booking');
    err.status = 409;
    err.code = 'INVALID_STATE';
    throw err;
  }

  if (booking.appointmentAt <= new Date()) {
    const err = new Error('Cannot cancel past appointments');
    err.status = 409;
    err.code = 'INVALID_STATE';
    throw err;
  }

  // Conditional update
  const updated = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      status: { $in: ['PENDING', 'CONFIRMED'] },
      appointmentAt: { $gt: new Date() },
    },
    { $set: { status: 'CANCELLED' } },
    { new: true }
  );

  return updated || booking; // if nothing matched, return original (should not happen)
}

module.exports = { createBooking, listBookings, getBooking, cancelBooking };
