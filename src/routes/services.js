const express = require('express');
const router = express.Router();
const { list } = require('../controllers/serviceController');

router.get('/', list);

module.exports = router;
