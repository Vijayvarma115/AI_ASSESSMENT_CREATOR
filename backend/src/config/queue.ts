import { Queue, QueueEvents } from 'bullmq';
import { createRedisClient } from './redis';
import { ASSESSMENT_QUEUE, AssessmentJobData } from './queueShared';

const queueConnection = createRedisClient('queue');
const queueEventsConnection = createRedisClient('queue-events');

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
