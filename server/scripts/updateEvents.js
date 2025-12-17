const mongoose = require('mongoose');
const Event = require('../models/Event');

async function updateEvents() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/voting-system');

    const result = await Event.updateMany({}, { isVerified: true });
    console.log(`Updated ${result.modifiedCount} events to verified`);

    process.exit(0);
  } catch (error) {
    console.error('Error updating events:', error);
    process.exit(1);
  }
}

updateEvents();