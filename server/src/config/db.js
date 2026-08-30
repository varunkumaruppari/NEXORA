import mongoose from 'mongoose';
import dns from 'dns';

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

  // Ensure SRV DNS records resolve reliably across Windows local networks and cloud environments
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (dnsErr) {
    // Ignore DNS override if custom environment prohibits it
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

