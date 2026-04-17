const mongoose = require('mongoose');

const IS_PROD = process.env.NODE_ENV === 'production';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // In production don't log the full Atlas host string (contains cluster info).
    if (IS_PROD) {
      console.log('✅ MongoDB connected');
    } else {
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    }
  } catch (error) {
    // Always log DB failures — they're critical regardless of environment.
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
