import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', healthRoutes);
app.use('/api/cases', caseRoutes);

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
