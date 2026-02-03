const Booking = require('../models/Booking');
const Service = require('../models/Service');

async function create(req, res, next) {
  try {
    const { serviceId, type, scheduledAt, address } = req.body;
    if (!serviceId || !type) {
      return res.status(400).json({ success: false, message: 'serviceId and type are required' });
    }
    if (!['instant', 'schedule'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be instant or schedule' });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(400).json({ success: false, message: 'Invalid service' });
    }

    const booking = await Booking.create({
      user: req.userId,
      service: serviceId,
      type,
      scheduledAt: type === 'schedule' && scheduledAt ? new Date(scheduledAt) : null,
      address: address || '',
      status: 'pending',
    });

    const populated = await Booking.findById(booking._id)
      .populate('service', 'title slug')
      .populate('user', 'name phone')
      .lean();

    res.status(201).json({ success: true, booking: populated });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const bookings = await Booking.find({ user: req.userId })
      .populate('service', 'title slug')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, bookings });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list };
