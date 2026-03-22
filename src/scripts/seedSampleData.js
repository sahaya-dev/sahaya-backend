/**
 * Seed sample users, bookings, and transactions for local testing.
 * Run: node src/scripts/seedSampleData.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');

const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

async function ensureServices() {
  const services = [
    { title: 'Kitchen & Utensil Cleaning', slug: 'kitchen-utensil-cleaning', category: 'cleaning', sortOrder: 1 },
    { title: 'Food Prep & Serving', slug: 'food-prep-serving', category: 'cooking', sortOrder: 2 },
    { title: 'Mopping Dusting & Wiping', slug: 'mopping-dusting-wiping', category: 'cleaning', sortOrder: 3 },
  ];

  for (const s of services) {
    await Service.findOneAndUpdate(
      { slug: s.slug },
      { $set: { ...s, isActive: true } },
      { upsert: true, new: true }
    );
  }
}

async function seed() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB connected');

    await ensureServices();
    const [svc1, svc2] = await Promise.all([
      Service.findOne({ slug: 'kitchen-utensil-cleaning' }),
      Service.findOne({ slug: 'food-prep-serving' }),
    ]);

    if (!svc1 || !svc2) {
      throw new Error('Required services not found after ensureServices().');
    }

    const userA = await User.findOneAndUpdate(
      { phone: '9876543210' },
      {
        $set: {
          phone: '9876543210',
          name: 'Amit Anand',
          gender: 'Male',
          address: '110, Estella Gracious apt, Bengaluru',
          referralCode: 'AMIT100',
          isProfileComplete: true,
        },
      },
      { upsert: true, new: true }
    );

    const userB = await User.findOneAndUpdate(
      { phone: '9876501234' },
      {
        $set: {
          phone: '9876501234',
          name: 'Priya N',
          gender: 'Female',
          address: 'HSR Layout, Bengaluru',
          referralCode: 'PRIYA50',
          referredBy: userA._id,
          isProfileComplete: true,
        },
      },
      { upsert: true, new: true }
    );

    const now = new Date();
    const booking1 = await Booking.create({
      user: userA._id,
      service: svc1._id,
      type: 'instant',
      status: 'confirmed',
      address: userA.address,
    });

    const booking2 = await Booking.create({
      user: userB._id,
      service: svc2._id,
      type: 'schedule',
      scheduledAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      status: 'pending',
      address: userB.address,
    });

    await Transaction.findOneAndUpdate(
      { txnId: `TXN-${booking1._id.toString().slice(-8)}-001` },
      {
        $set: {
          booking: booking1._id,
          txnId: `TXN-${booking1._id.toString().slice(-8)}-001`,
          txnAmt: 499,
          user: userA._id,
        },
      },
      { upsert: true, new: true }
    );

    await Transaction.findOneAndUpdate(
      { txnId: `TXN-${booking2._id.toString().slice(-8)}-001` },
      {
        $set: {
          booking: booking2._id,
          txnId: `TXN-${booking2._id.toString().slice(-8)}-001`,
          txnAmt: 799,
          user: userB._id,
        },
      },
      { upsert: true, new: true }
    );

    console.log('Sample data seeded successfully');
    console.log(`Users: ${await User.countDocuments()}`);
    console.log(`Services: ${await Service.countDocuments()}`);
    console.log(`Bookings: ${await Booking.countDocuments()}`);
    console.log(`Transactions: ${await Transaction.countDocuments()}`);
  } catch (err) {
    console.error('Seed sample data error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
