
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    amountPaise: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
    },
    providerRef: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// Partial unique index: only one SUCCESS payment per booking
paymentSchema.index(
  { bookingId: 1 },
  { unique: true, partialFilterExpression: { status: 'SUCCESS' } }
);

paymentSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Payment', paymentSchema);
