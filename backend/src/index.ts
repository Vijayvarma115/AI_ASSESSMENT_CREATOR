import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { redis, redisSubscriber } from './config/redis';
import { wsManager } from './config/websocket';
import assignmentRoutes from './routes/assignments';
import { startWorker } from './worker';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-assessment';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const RUN_WORKER_IN_API = process.env.RUN_WORKER_IN_API === 'true';

let mongoConnected = false;
let workerStartedInApi = false;

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/assignments', assignmentRoutes);

app.get('/health', (_req, res) => {
  res.json({
    status: mongoConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    wsClients: wsManager.getClientCount(),
    dependencies: {
      mongodb: mongoConnected ? 'connected' : 'disconnected',
    },
  });
});

// WebSocket setup
wsManager.initialize(server);

// Redis Pub/Sub - bridge Redis messages to WebSocket clients
async function subscribeToAssignmentUpdates(retryDelayMs = 5000) {
  try {
    await redisSubscriber.subscribe('assignment-updates');
    console.log('✅ Subscribed to assignment-updates channel');
  } catch (err) {
    console.error('Redis subscribe failed, retrying...', err);
    setTimeout(() => {
      void subscribeToAssignmentUpdates(retryDelayMs);
    }, retryDelayMs);
  }
}

redisSubscriber.on('message', (_channel: string, message: string) => {
  try {
    const payload = JSON.parse(message);
    if (payload.assignmentId) {
      wsManager.notifyAssignment(payload.assignmentId, payload);
    }
  } catch (err) {
    console.error('Redis message parse error:', err);
  }
});

async function connectMongoWithRetry(retryDelayMs = 5000) {
  while (!mongoConnected) {
    try {
      await mongoose.connect(MONGODB_URI);
      mongoConnected = true;
      console.log('✅ MongoDB connected');

      if (RUN_WORKER_IN_API && !workerStartedInApi) {
        await startWorker();
        workerStartedInApi = true;
        console.log('✅ Worker started in API process');
      }
    } catch (err) {
      console.error('MongoDB connection failed, retrying...', err);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
}

// Server start
function bootstrap() {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
  });

  void subscribeToAssignmentUpdates();

  // Keep process alive and retry DB until connected.
  void connectMongoWithRetry();
}

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await mongoose.disconnect();
  redis.disconnect();
  redisSubscriber.disconnect();
  server.close(() => process.exit(0));
});

bootstrap();
