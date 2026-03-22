import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import { redis } from './config/redis';
import { ASSESSMENT_QUEUE, AssessmentJobData, getBullMQConnection } from './config/queueShared';
import { Assignment } from './models/Assignment';
import { generateAssessment } from './services/groqService';
import { setCache } from './config/redis';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-assessment';

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    console.log('✅ Worker: MongoDB already connected');
    return;
  }

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Worker: MongoDB connected');
}

async function processAssessmentJob(job: Job<AssessmentJobData>) {
  const { assignmentId } = job.data;
  console.log(`⚙️ Processing job ${job.id} for assignment ${assignmentId}`);

  // Update status to processing
  await Assignment.findByIdAndUpdate(assignmentId, {
    status: 'processing',
    jobId: job.id,
  });

  // Notify via Redis pub/sub (WebSocket server listens)
  await redis.publish(
    'assignment-updates',
    JSON.stringify({
      type: 'status_update',
      assignmentId,
      status: 'processing',
      progress: 20,
      message: 'Analyzing requirements...',
    })
  );

  await job.updateProgress(20);

  // Simulate analysis step
  await new Promise((r) => setTimeout(r, 800));

  await redis.publish(
    'assignment-updates',
    JSON.stringify({
      type: 'status_update',
      assignmentId,
      status: 'processing',
      progress: 40,
      message: 'Structuring question paper...',
    })
  );

  await job.updateProgress(40);

  // Generate the assessment
  const generatedPaper = await generateAssessment(job.data);

  await redis.publish(
    'assignment-updates',
    JSON.stringify({
      type: 'status_update',
      assignmentId,
      status: 'processing',
      progress: 80,
      message: 'Validating and formatting...',
    })
  );

  await job.updateProgress(80);

  // Save to DB
  await Assignment.findByIdAndUpdate(assignmentId, {
    status: 'completed',
    generatedPaper,
  });

  // Cache the result
  await setCache(`assignment:${assignmentId}`, {
    status: 'completed',
    generatedPaper,
  });

  await job.updateProgress(100);

  // Final notification
  await redis.publish(
    'assignment-updates',
    JSON.stringify({
      type: 'completed',
      assignmentId,
      status: 'completed',
      progress: 100,
      message: 'Question paper ready!',
      generatedPaper,
    })
  );

  console.log(`✅ Job ${job.id} completed successfully`);
  return { assignmentId, status: 'completed' };
}

export async function startWorker() {
  await connectDB();
  const workerConnection = getBullMQConnection();

  const worker = new Worker<AssessmentJobData>(
    ASSESSMENT_QUEUE,
    processAssessmentJob,
    {
      connection: workerConnection,
      concurrency: 3,
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Worker: Job ${job.id} done`);
  });

  worker.on('failed', async (job, err) => {
    console.error(`❌ Worker: Job ${job?.id} failed:`, err.message);
    if (job?.data.assignmentId) {
      await Assignment.findByIdAndUpdate(job.data.assignmentId, {
        status: 'failed',
        errorMessage: err.message,
      });
      await redis.publish(
        'assignment-updates',
        JSON.stringify({
          type: 'failed',
          assignmentId: job.data.assignmentId,
          status: 'failed',
          message: `Generation failed: ${err.message}`,
        })
      );
    }
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  console.log('🚀 Worker started, waiting for jobs...');

  return worker;
}

if (require.main === module) {
  startWorker().catch(console.error);
}
