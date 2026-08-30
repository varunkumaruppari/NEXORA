import mongoose from 'mongoose';

/**
 * Connect to MongoDB instance using Mongoose.
 * Gracefully logs warnings if MONGODB_URI is absent so server can run in basic mode.
 */
export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn('⚠️  MONGODB_URI is not defined in environment variables. Database features will be limited.');
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Do not terminate process during development setup
    return false;
  }
};
