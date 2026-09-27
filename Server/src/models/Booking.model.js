
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    centreId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiagnosticCentre', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiagnosticTest', required: true },
    appointmentAt: { type: Date, required: true },
    amountPaise: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);


bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ centreId: 1, appointmentAt: 1 });


bookingSchema.index(
  { userId: 1, centreId: 1, testId: 1, appointmentAt: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['PENDING', 'CONFIRMED'] } },
  }
);

bookingSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Booking', bookingSchema);
