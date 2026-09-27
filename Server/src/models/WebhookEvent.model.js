
const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    providerRef: { type: String, required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      required: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed },
    processingResult: {
      type: String,
      enum: ['APPLIED', 'DUPLICATE', 'IGNORED', 'REJECTED'],
    },
  },
  { timestamps: true }
);

webhookEventSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
