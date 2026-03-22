import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { redis, redisSubscriber } from './config/redis';
import { wsManager } from './config/websocket';
import assignmentRoutes from './routes/assignments';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-assessment';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

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
    status: 'ok',
    timestamp: new Date().toISOString(),
    wsClients: wsManager.getClientCount(),
  });
});

// WebSocket setup
wsManager.initialize(server);

// Redis Pub/Sub - bridge Redis messages to WebSocket clients
redisSubscriber.subscribe('assignment-updates', (err) => {
  if (err) console.error('Redis subscribe error:', err);
  else console.log('✅ Subscribed to assignment-updates channel');
});

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

// Database connection & server start
async function bootstrap() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
    });
  } catch (err) {
    console.error('Bootstrap error:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await mongoose.disconnect();
  redis.disconnect();
  redisSubscriber.disconnect();
  server.close(() => process.exit(0));
});

bootstrap();
