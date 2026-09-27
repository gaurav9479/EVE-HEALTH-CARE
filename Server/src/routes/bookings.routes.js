// src/routes/bookings.js
const express = require('express');
const validate = require('../middleware/validate.middleware');
const { createBookingSchema } = require('../schemas/bookings');
const bookingService = require('../modules/bookings/booking service');
const { toRupeeString } = require('../lib/money');
const { verifyToken } = require('../middleware/auth.middleware');
const Booking = require('../models/Booking.model');

const router = express.Router();


router.use(verifyToken);


function transformBooking(doc) {
  const obj = doc.toObject();
  obj.amountPaise = toRupeeString(obj.amountPaise);
  if (obj.centreId) {
    obj.centre = { _id: obj.centreId._id, name: obj.centreId.name, location: obj.centreId.location };
    delete obj.centreId;
  }
  if (obj.testId) {
    obj.test = { _id: obj.testId._id, name: obj.testId.name, description: obj.testId.description };
    delete obj.testId;
  }
  return obj;
}


router.post('/', validate(createBookingSchema), async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(req.user.id, req.validated);
    const populated = await Booking.findById(booking._id)
      .populate('centreId', 'name location')
      .populate('testId', 'name description');
    res.status(201).json({ booking: transformBooking(populated) });
  } catch (err) {
    next(err);
  }
});


router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await bookingService.listBookings(req.user.id, req.user.role === 'ADMIN', page, limit);
    const transformed = result.data.map(transformBooking);
    res.json({ bookings: transformed, meta: result.meta });
  } catch (err) {
    next(err);
  }
});


router.get('/:id', async (req, res, next) => {
  try {
    const booking = await bookingService.getBooking(req.user.id, req.user.role === 'ADMIN', req.params.id);
    const doc = await Booking.findById(req.params.id)
      .populate('centreId', 'name location')
      .populate('testId', 'name description');
    if (!doc) {
      const err = new Error('Booking not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    res.json({ booking: transformBooking(doc) });
  } catch (err) {
    next(err);
  }
});


router.post('/:id/cancel', async (req, res, next) => {
  try {
    const updated = await bookingService.cancelBooking(req.user.id, req.user.role === 'ADMIN', req.params.id);
    const doc = await Booking.findById(req.params.id)
      .populate('centreId', 'name location')
      .populate('testId', 'name description');
    res.json({ booking: transformBooking(doc) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
