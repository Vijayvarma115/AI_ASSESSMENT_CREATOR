import { Queue, QueueEvents } from 'bullmq';
import { ASSESSMENT_QUEUE, AssessmentJobData, getBullMQConnection } from './queueShared';

const queueConnection = getBullMQConnection();
const queueEventsConnection = getBullMQConnection();

export const assessmentQueue = new Queue(ASSESSMENT_QUEUE, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const queueEvents = new QueueEvents(ASSESSMENT_QUEUE, {
  connection: queueEventsConnection,
});

queueEvents.on('completed', ({ jobId }) => {
  console.log(`✅ Job ${jobId} completed`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`❌ Job ${jobId} failed:`, failedReason);
});
