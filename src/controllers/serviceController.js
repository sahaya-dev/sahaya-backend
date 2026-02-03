const Service = require('../models/Service');

async function list(req, res, next) {
  try {
    const services = await Service.find({ isActive: true })
      .sort({ sortOrder: 1, title: 1 })
      .select('-__v')
      .lean();
    res.json({ success: true, services });
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
