const mongoose = require('mongoose');

const otpStoreSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
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

otpStoreSchema.index({ phone: 1 });
otpStoreSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index - auto-delete expired

module.exports = mongoose.model('OtpStore', otpStoreSchema);
