const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    txnId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    txnAmt: {
      type: Number,
      required: true,
      min: 0,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ booking: 1 });
transactionSchema.index({ user: 1, createdAt: -1 });
// txnId unique index comes from field `unique: true` above

module.exports = mongoose.model('Transaction', transactionSchema);
