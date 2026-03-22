export const ASSESSMENT_QUEUE = 'assessment-generation';

export function getBullMQConnection() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const parsed = new URL(redisUrl);

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}

export interface AssessmentJobData {
  assignmentId: string;
  title: string;
  subject: string;
  gradeLevel: string;
  questionTypes: string[];
  totalQuestions: number;
  totalMarks: number;
  difficulty: string;
  additionalInstructions: string;
  fileContent?: string;
}
