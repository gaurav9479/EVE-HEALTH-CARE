
const mongoose = require('mongoose');


const createBookingSchema = new mongoose.Schema(
  {
    centreId: { type: mongoose.Schema.Types.ObjectId, required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, required: true },
    appointmentAt: { type: Date, required: true },
  },
  { _id: false, strict: true }
);

module.exports = { createBookingSchema };
