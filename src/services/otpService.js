const OtpStore = require('../models/OtpStore');
const config = require('../config');

function generateOtp(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

async function saveOtp(phone, otp) {
  const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000);
  await OtpStore.findOneAndUpdate(
    { phone },
    { phone, otp, expiresAt },
    { upsert: true, new: true }
  );
}

async function verifyOtp(phone, otp) {
  const record = await OtpStore.findOne({ phone }).sort({ createdAt: -1 });
  if (!record) return false;
  if (new Date() > record.expiresAt) return false;
  return record.otp === otp;
}

async function deleteOtp(phone) {
  await OtpStore.deleteMany({ phone });
}

module.exports = {
  generateOtp,
  saveOtp,
  verifyOtp,
  deleteOtp,
};
