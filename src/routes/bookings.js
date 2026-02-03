const express = require('express');
const router = express.Router();
const { create, list } = require('../controllers/bookingController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.post('/', create);
router.get('/', list);

module.exports = router;
