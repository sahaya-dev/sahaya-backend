/**
 * Create MongoDB collections and indexes for Sahaya.
 * Run: node src/scripts/initDb.js
 * (Requires MongoDB running and MONGODB_URI in .env or default localhost)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');

// Load all models so they're registered and their indexes are defined
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const OtpStore = require('../models/OtpStore');
const Transaction = require('../models/Transaction');

const COLLECTIONS = [
  { name: 'users', model: User },
  { name: 'services', model: Service },
  { name: 'bookings', model: Booking },
  { name: 'otpstores', model: OtpStore },
  { name: 'transactions', model: Transaction },
];

async function initDb() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB:', config.mongodbUri.replace(/\/\/[^@]+@/, '//***@'));

    for (const { name, model } of COLLECTIONS) {
      // createIndexes() creates the collection if it doesn't exist, then creates all schema indexes
      await model.createIndexes();
      console.log('Collection + indexes ready:', name);
    }

    console.log('\nDone. All collections and indexes are ready.');
  } catch (err) {
    console.error('Init DB error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

initDb();
