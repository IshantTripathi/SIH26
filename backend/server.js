import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';

import authRoutes from './src/routes/authRoutes.js';
import jobsRoutes from './src/routes/jobsRoutes.js';
import allocationRoutes from './src/routes/allocationRoutes.js';
import workerRoutes from './src/routes/workerRoutes.js';
import societyRoutes from './src/routes/societyRoutes.js';
import federationRoutes from './src/routes/federationRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import welfareRoutes from './src/routes/welfareRoutes.js';
import complaintRoutes from './src/routes/complaintRoutes.js';
import auditRoutes from './src/routes/auditRoutes.js';
import loyaltyRoutes from './src/routes/loyaltyRoutes.js';
import emergencyRoutes from './src/routes/emergencyRoutes.js';
import applicationRoutes from './src/routes/applicationRoutes.js';
import pricingRoutes from './src/routes/pricingRoutes.js';
import trustRoutes from './src/routes/trustRoutes.js';
import matchingRoutes from './src/routes/matchingRoutes.js';
import workloadRoutes from './src/routes/workloadRoutes.js';
import governanceRoutes from './src/routes/governanceRoutes.js';
import voiceRoutes from './src/routes/voiceRoutes.js';
import passportRoutes from './src/routes/passportRoutes.js';
import predictiveRoutes from './src/routes/predictiveRoutes.js';
import impactRoutes from './src/routes/impactRoutes.js';
import schedulingRoutes from './src/routes/schedulingRoutes.js';
import wellnessRoutes from './src/routes/wellnessRoutes.js';
import dividendRoutes from './src/routes/dividendRoutes.js';
import arRoutes from './src/routes/arRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*';

// Connect Database (MongoDB Atlas with atomic store fallback)
connectDB();

// Middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-user-id']
}));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    problemStatementId: 'SIH26089',
    service: 'SIH26089 Cooperative Gig Services Platform Backend',
    department: 'Ministry of Cooperation / NCCT',
    environment: 'Demo Environment',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/allocation', allocationRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/society', societyRoutes);
app.use('/api/federation', federationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/welfare', welfareRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/system', auditRoutes);
app.use('/api', loyaltyRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/onboarding', applicationRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/trust', trustRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/workload', workloadRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/passport', passportRoutes);
app.use('/api/predictive', predictiveRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/dividend', dividendRoutes);
app.use('/api/ar-guidance', arRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err.message);
  res.status(500).json({
    success: false,
    message: 'An error occurred while processing your cooperative platform request. Please try again.'
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Ministry of Cooperation / NCCT - SIH26089 Platform `);
  console.log(` Cooperative Gig Services API Server running on port ${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
