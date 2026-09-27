
const mongoose = require('mongoose');

const testSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);

testSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('DiagnosticTest', testSchema);
