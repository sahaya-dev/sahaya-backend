const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const serviceRoutes = require('./services');
const bookingRoutes = require('./bookings');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/services', serviceRoutes);
router.use('/bookings', bookingRoutes);

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Sahaya API is running' });
});

module.exports = router;
