import dotenv from 'dotenv';
// Load environment variables immediately before imports
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  // Attempt DB connection
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 RESOLV AI Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`\n✅ RESOLV AI Server is already running on port ${PORT}.`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/health\n`);
    } else {
      console.error('Server error:', error);
    }
  });
};

startServer();
