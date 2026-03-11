import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import visitorRoutes from './routes/visitors.js';
import appointmentRoutes from './routes/appointments.js';
import passRoutes from './routes/passes.js';
import checkLogRoutes from './routes/checklogs.js';
import organizationRoutes from './routes/organizations.js';
import otpRoutes from './routes/otp.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/checklogs', checkLogRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/otp', otpRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Visitor Pass Management API - Multi-Organization with OTP',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      visitors: '/api/visitors',
      appointments: '/api/appointments',
      passes: '/api/passes',
      checklogs: '/api/checklogs',
      organizations: '/api/organizations',
      otp: '/api/otp'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   Visitor Pass Management System - Backend Server     ║
║   Multi-Organization with OTP Support                 ║
║                                                        ║
║   Server running on: http://localhost:${PORT}           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
║   MongoDB: Connected                                   ║
║                                                        ║
║   API Endpoints:                                       ║
║   - Auth:          /api/auth                           ║
║   - Visitors:      /api/visitors                       ║
║   - Appointments:  /api/appointments                   ║
║   - Passes:        /api/passes                         ║
║   - Check Logs:    /api/checklogs                      ║
║   - Organizations: /api/organizations                  ║
║   - OTP:           /api/otp                            ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

export default app;
