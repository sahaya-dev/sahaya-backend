const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtpAndLogin, register } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpAndLogin);
router.post('/register', authMiddleware, register);

module.exports = router;
