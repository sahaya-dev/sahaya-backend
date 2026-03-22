const express = require('express');
const router = express.Router();
const { devDbAuth } = require('../middleware/devDbAuth');
const {
  insertServices,
  insertUser,
  insertBooking,
  insertTransaction,
  devSummary,
} = require('../controllers/devDbController');

router.use(devDbAuth);

router.get('/summary', devSummary);
router.post('/services', insertServices);
router.post('/users', insertUser);
router.post('/bookings', insertBooking);
router.post('/transactions', insertTransaction);

module.exports = router;
