const User = require('../models/User');
const { generateOtp, saveOtp, verifyOtp, deleteOtp } = require('../services/otpService');
const { signToken } = require('../utils/jwt');

async function sendOtp(req, res, next) {
  try {
    const { phone } = req.body;
    const normalized = String(phone).replace(/\D/g, '').slice(-10);
    if (normalized.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number' });
    }

    const otp = generateOtp(6);
    await saveOtp(normalized, otp);

    // In production: send SMS via Twilio/MSG91 etc. For dev, we return OTP (remove in prod)
    const isDev = process.env.NODE_ENV !== 'production';
    res.json({
      success: true,
      message: 'OTP sent successfully',
      ...(isDev && { otp }),
    });
  } catch (err) {
    next(err);
  }
}

async function verifyOtpAndLogin(req, res, next) {
  try {
    const { phone, otp } = req.body;
    const normalized = String(phone).replace(/\D/g, '').slice(-10);
    if (normalized.length !== 10 || !otp || String(otp).length !== 6) {
      return res.status(400).json({ success: false, message: 'Invalid phone or OTP' });
    }

    const valid = await verifyOtp(normalized, String(otp).trim());
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    await deleteOtp(normalized);

    let user = await User.findOne({ phone: normalized });
    if (!user) {
      user = await User.create({ phone: normalized });
    }

    const token = signToken({ userId: user._id.toString() });
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        gender: user.gender,
        address: user.address,
        isProfileComplete: user.isProfileComplete,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const { name, gender, referralCode } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!gender || !['Male', 'Female'].includes(gender)) {
      return res.status(400).json({ success: false, message: 'Please select Male or Female' });
    }

    user.name = name.trim();
    user.gender = gender;
    user.referralCode = referralCode ? String(referralCode).trim() : '';
    user.isProfileComplete = true;
    await user.save();

    const token = signToken({ userId: user._id.toString() });
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        gender: user.gender,
        address: user.address,
        isProfileComplete: user.isProfileComplete,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendOtp, verifyOtpAndLogin, register };
