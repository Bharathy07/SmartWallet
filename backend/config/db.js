const mongoose = require('mongoose');

// MongoDB connection helper
// Spec-required: local MongoDB at mongodb://localhost:27017/smartwallet_ai
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartwallet_ai';

  if (uri.includes('atlas')) {
    throw new Error('MongoDB Atlas is not allowed for this project. Use local MongoDB.');
  }

  await mongoose.connect(uri, {
    // Connection pooling + modern driver options
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
    autoIndex: process.env.NODE_ENV !== 'production',
  });

  console.log('[db] connected to:', uri);
}




module.exports = { connectDB };




