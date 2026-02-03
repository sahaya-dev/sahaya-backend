const mongoose = require('mongoose');

const otpStoreSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

otpStoreSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index - MongoDB auto-deletes expired docs

module.exports = mongoose.model('OtpStore', otpStoreSchema);
