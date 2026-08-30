import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Dynamic CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', healthRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/location', deliveryRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Central Error Handler
app.use(errorHandler);

export default app;
