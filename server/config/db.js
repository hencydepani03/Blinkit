const mongoose = require('mongoose');

const DEFAULT_URI = 'mongodb+srv://vaghasiyajenil29:kjPWryrgi2Eh.2@@cluster0.d5a6vtx.mongodb.net/';

async function connectDB() {
  const uri = process.env.MONGO_URI || DEFAULT_URI;

  if (!uri) {
    throw new Error('Missing MongoDB connection string. Set MONGO_URI in your environment.');
  }

  try {
    await mongoose.connect(uri, {
      // Additional options can be added if needed
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
}

module.exports = connectDB;
