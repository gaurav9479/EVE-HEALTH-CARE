
const mongoose = require('mongoose');

const centreTestSchema = new mongoose.Schema(
  {
    centreId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiagnosticCentre', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiagnosticTest', required: true },
    pricePaise: { type: Number, required: true, min: 1 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);


centreTestSchema.index({ centreId: 1, testId: 1 }, { unique: true });

centreTestSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('CentreTest', centreTestSchema);
