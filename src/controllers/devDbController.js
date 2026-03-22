const mongoose = require('mongoose');
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

function parseObjectId(id, fieldName) {
  if (!id) return null;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return new mongoose.Types.ObjectId(id);
}

/** POST body: one service or { services: [...] } */
async function insertServices(req, res, next) {
  try {
    let items = req.body;
    if (items && Array.isArray(items.services)) {
      items = items.services;
    } else if (items && !Array.isArray(items)) {
      items = [items];
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Send a service object or { "services": [ {...}, ... ] } with title, slug',
      });
    }

    const created = [];
    for (const s of items) {
      const doc = await Service.findOneAndUpdate(
        { slug: s.slug },
        {
          $set: {
            title: s.title,
            slug: s.slug,
            description: s.description ?? '',
            imageUrl: s.imageUrl ?? '',
            category: s.category ?? 'other',
            isActive: s.isActive !== false,
            sortOrder: typeof s.sortOrder === 'number' ? s.sortOrder : 0,
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
      created.push(doc.toObject());
    }
    res.status(201).json({ success: true, count: created.length, services: created });
  } catch (err) {
    next(err);
  }
}

/** POST { phone, name?, gender?, address?, referralCode?, isProfileComplete? } — upsert by phone */
async function insertUser(req, res, next) {
  try {
    const { phone, name, gender, address, referralCode, isProfileComplete, referredBy } = req.body;
    const normalized = String(phone || '').replace(/\D/g, '').slice(-10);
    if (normalized.length !== 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone required' });
    }

    const update = {
      phone: normalized,
      name: name != null ? String(name).trim() : '',
      gender: ['Male', 'Female', ''].includes(gender) ? gender : '',
      address: address != null ? String(address).trim() : '',
      referralCode: referralCode != null ? String(referralCode).trim() : '',
      isProfileComplete: Boolean(isProfileComplete),
    };
    if (referredBy) {
      update.referredBy = parseObjectId(referredBy, 'referredBy');
    }

    const user = await User.findOneAndUpdate({ phone: normalized }, { $set: update }, { upsert: true, new: true, runValidators: true });

    res.status(201).json({
      success: true,
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

/** POST { userId, serviceId, type, scheduledAt?, status?, address? } */
async function insertBooking(req, res, next) {
  try {
    const { userId, serviceId, type, scheduledAt, status, address } = req.body;
    const user = parseObjectId(userId, 'userId');
    const service = parseObjectId(serviceId, 'serviceId');
    if (!user || !service) {
      return res.status(400).json({ success: false, message: 'userId and serviceId are required' });
    }
    if (!type || !['instant', 'schedule'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be instant or schedule' });
    }

    const [u, svc] = await Promise.all([User.findById(user), Service.findById(service)]);
    if (!u) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }
    if (!svc) {
      return res.status(400).json({ success: false, message: 'Service not found' });
    }

    const booking = await Booking.create({
      user,
      service,
      type,
      scheduledAt: type === 'schedule' && scheduledAt ? new Date(scheduledAt) : null,
      status: status && ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(status) ? status : 'pending',
      address: address != null ? String(address) : '',
    });

    const populated = await Booking.findById(booking._id)
      .populate('service', 'title slug')
      .populate('user', 'name phone')
      .lean();

    res.status(201).json({ success: true, booking: populated });
  } catch (err) {
    if (err.message && err.message.startsWith('Invalid')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/** POST { bookingId, userId, txnId, txnAmt } */
async function insertTransaction(req, res, next) {
  try {
    const { bookingId, userId, txnId, txnAmt } = req.body;
    const booking = parseObjectId(bookingId, 'bookingId');
    const user = parseObjectId(userId, 'userId');
    if (!booking || !user || !txnId) {
      return res.status(400).json({ success: false, message: 'bookingId, userId, txnId are required' });
    }
    if (txnAmt == null || Number(txnAmt) < 0) {
      return res.status(400).json({ success: false, message: 'txnAmt must be a number >= 0' });
    }

    const b = await Booking.findById(booking);
    if (!b) {
      return res.status(400).json({ success: false, message: 'Booking not found' });
    }

    const doc = await Transaction.findOneAndUpdate(
      { txnId: String(txnId).trim() },
      {
        $set: {
          booking,
          user,
          txnId: String(txnId).trim(),
          txnAmt: Number(txnAmt),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({ success: true, transaction: doc.toObject() });
  } catch (err) {
    if (err.message && err.message.startsWith('Invalid')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/** GET — list counts (quick sanity check) */
async function devSummary(req, res, next) {
  try {
    const [users, services, bookings, transactions] = await Promise.all([
      User.countDocuments(),
      Service.countDocuments(),
      Booking.countDocuments(),
      Transaction.countDocuments(),
    ]);
    res.json({
      success: true,
      counts: { users, services, bookings, transactions },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  insertServices,
  insertUser,
  insertBooking,
  insertTransaction,
  devSummary,
};
