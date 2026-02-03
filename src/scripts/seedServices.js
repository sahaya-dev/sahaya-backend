/**
 * Seed default services matching the Sahaya mobile app landing page.
 * Run: node src/scripts/seedServices.js (after starting MongoDB and setting MONGODB_URI)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('../models/Service');

const services = [
  { title: 'Kitchen & Utensil Cleaning', slug: 'kitchen-utensil-cleaning', category: 'cleaning', sortOrder: 1 },
  { title: 'Food Prep & Serving', slug: 'food-prep-serving', category: 'cooking', sortOrder: 2 },
  { title: 'Mopping Dusting & Wiping', slug: 'mopping-dusting-wiping', category: 'cleaning', sortOrder: 3 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sahaya');
    for (const s of services) {
      await Service.findOneAndUpdate({ slug: s.slug }, { $set: s }, { upsert: true, new: true });
    }
    console.log('Services seeded:', services.length);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
